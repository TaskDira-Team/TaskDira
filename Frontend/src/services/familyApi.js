import { http, writeStoredSession } from "./httpClient";
import { USE_REAL_API } from "./config";
import { store, getActiveHouseholdId, ensureLedgerEntry } from "./store";
import { clearRealHouseholdId, setRealHouseholdId } from "./householdContext";
import {
  persistDemoFamily,
  reloadDemoFamily,
  passwordDigest,
} from "./familyDemo";

const token = () =>
  [...crypto.getRandomValues(new Uint8Array(32))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
const future = (ms) => new Date(Date.now() + ms).toISOString();
const week = 7 * 24 * 60 * 60 * 1000;
const demo = () => {
  reloadDemoFamily();
  return store.family;
};
const admin = (household) => {
  const user = store.currentUser;
  if (
    !user ||
    user.isManagedProfile ||
    !store.members.some(
      (m) =>
        m.householdId === household &&
        m.userId === user.id &&
        m.role === "Admin",
    )
  )
    throw new Error("Only a household admin can manage family access.");
  return user;
};
const validInvite = (value) => {
  const invite = demo().invitations.find((i) => i.token === value);
  if (
    !invite ||
    invite.revoked ||
    invite.acceptedBy ||
    Date.parse(invite.expiresAt) <= Date.now() ||
    !store.members.some(
      (m) =>
        m.householdId === invite.householdId &&
        m.userId === invite.creatorId &&
        m.role === "Admin",
    )
  )
    throw new Error(
      "This invitation has expired, was used, or was cancelled. Ask your host for a new link.",
    );
  return invite;
};
const childInHome = (household, child) => {
  if (
    !store.users.some((u) => u.id === child && u.isManagedProfile) ||
    !store.members.some(
      (m) =>
        m.userId === child &&
        m.householdId === household &&
        m.role === "Member",
    )
  )
    throw new Error("Choose a child in this home.");
};
const session = (userId, householdId, isManagedProfile) => ({
  userId,
  householdId,
  isManagedProfile,
  token: `td.mock.${token()}`,
  expiresAt: future((isManagedProfile ? 8 : 720) * 3600000),
});

export function installFamilySession(value) {
  clearRealHouseholdId();
  if (USE_REAL_API.auth) setRealHouseholdId(value.householdId);
  writeStoredSession(value);
  // Reload at the boundary so no parent controls or cached household data survive.
  window.location.hash = "/";
  window.location.reload();
}

export const familyApi = {
  async list(household = getActiveHouseholdId()) {
    if (USE_REAL_API.auth) return http.get(`/api/family/${household}`);
    demo();
    admin(household);
    return {
      children: store.users
        .filter(
          (u) =>
            u.isManagedProfile &&
            store.members.some(
              (m) => m.householdId === household && m.userId === u.id,
            ),
        )
        .map((u) => ({
          userId: u.id,
          fullName: u.fullName,
          avatarState: u.avatarState,
        })),
      invitations: store.family.invitations
        .filter((i) => i.householdId === household)
        .slice()
        .reverse()
        .map((i) => ({
          id: i.id,
          expiresAt: i.expiresAt,
          createdAt: i.createdAt,
          status: i.revoked
            ? "revoked"
            : i.acceptedBy
              ? "accepted"
              : Date.parse(i.expiresAt) <= Date.now()
                ? "expired"
                : "pending",
        })),
    };
  },
  async invite(household) {
    if (USE_REAL_API.auth)
      return http.post(`/api/family/${household}/invitations`);
    const data = demo(),
      caller = admin(household);
    const invitation = {
      id: crypto.randomUUID(),
      token: token(),
      householdId: household,
      creatorId: caller.id,
      createdAt: new Date().toISOString(),
      expiresAt: future(week),
    };
    data.invitations.push(invitation);
    persistDemoFamily();
    return { token: invitation.token, invitation };
  },
  async revoke(household, id) {
    if (USE_REAL_API.auth)
      return http.del(`/api/family/${household}/invitations/${id}`);
    demo();
    admin(household);
    const invitation = store.family.invitations.find(
      (i) => i.id === id && i.householdId === household,
    );
    if (invitation && !invitation.acceptedBy) invitation.revoked = true;
    persistDemoFamily();
  },
  async preview(value) {
    if (USE_REAL_API.auth)
      return http.post(
        "/api/family/invitations/preview",
        { token: value },
        { auth: false },
      );
    const invitation = validInvite(value);
    return {
      householdName: store.households.find(
        (h) => h.id === invitation.householdId,
      )?.name,
      expiresAt: invitation.expiresAt,
    };
  },
  async accept(value) {
    if (USE_REAL_API.auth)
      return http.post("/api/family/invitations/accept", { token: value });
    const invitation = validInvite(value),
      user = store.currentUser;
    if (!user || user.isManagedProfile)
      throw new Error("An adult needs to sign in to join.");
    if (
      store.members.some(
        (m) => m.userId === user.id && m.householdId === invitation.householdId,
      )
    )
      throw new Error("You already belong to this home.");
    store.members.push({
      householdId: invitation.householdId,
      userId: user.id,
      role: "Member",
      joinedAt: new Date().toISOString(),
    });
    invitation.acceptedBy = user.id;
    ensureLedgerEntry(user.id, invitation.householdId);
    persistDemoFamily();
    return { householdId: invitation.householdId, userId: user.id };
  },
  async join(value, fields) {
    if (USE_REAL_API.auth)
      return http.post(
        "/api/family/invitations/join",
        { token: value, ...fields },
        { auth: false },
      );
    // Hash before taking the latest snapshot; no await between validation and consumption.
    const passwordHash = await passwordDigest(fields.password);
    const invitation = validInvite(value);
    if (
      store.users.some(
        (u) => u.email.toLowerCase() === fields.email.trim().toLowerCase(),
      )
    )
      throw new Error("This email already has an account. Sign in to accept.");
    const user = {
      id: crypto.randomUUID(),
      fullName: fields.fullName.trim(),
      email: fields.email.trim().toLowerCase(),
      passwordHash,
      familyRole: "adult",
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    store.members.push({
      householdId: invitation.householdId,
      userId: user.id,
      role: "Member",
      joinedAt: user.createdAt,
    });
    invitation.acceptedBy = user.id;
    ensureLedgerEntry(user.id, invitation.householdId);
    persistDemoFamily();
    return session(user.id, invitation.householdId, false);
  },
  async child(household, nickname, avatarState) {
    if (USE_REAL_API.auth)
      return http.post(`/api/family/${household}/children`, {
        nickname,
        avatarState: JSON.stringify(avatarState),
      });
    demo();
    admin(household);
    if (!nickname.trim()) throw new Error("Give your little hero a nickname.");
    const user = {
      id: crypto.randomUUID(),
      fullName: nickname.trim(),
      email: "",
      avatarState,
      isManagedProfile: true,
      familyRole: "kid",
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    store.members.push({
      userId: user.id,
      householdId: household,
      role: "Member",
      joinedAt: user.createdAt,
    });
    ensureLedgerEntry(user.id, household);
    persistDemoFamily();
    return { userId: user.id };
  },
  async play(household, child) {
    if (USE_REAL_API.auth)
      return http.post(`/api/family/${household}/children/${child}/play`);
    demo();
    admin(household);
    childInHome(household, child);
    return session(child, household, true);
  },
  async startPairing() {
    if (USE_REAL_API.auth)
      return http.post("/api/family/pairings", undefined, { auth: false });
    const data = demo();
    const pairing = {
      secret: token(),
      code: token().slice(0, 10).toUpperCase(),
      expiresAt: future(600000),
    };
    data.pairings.push(pairing);
    persistDemoFamily();
    return pairing;
  },
  async approve(household, childId, code) {
    if (USE_REAL_API.auth)
      return http.post(`/api/family/${household}/pairings/approve`, {
        childId,
        code,
      });
    demo();
    admin(household);
    childInHome(household, childId);
    const pairing = store.family.pairings.find(
      (p) => p.code === code.replace(/[-\s]/g, "").toUpperCase(),
    );
    if (
      !pairing ||
      pairing.childId ||
      Date.parse(pairing.expiresAt) <= Date.now()
    )
      throw new Error(
        "This code has expired or was already approved. Create a new code.",
      );
    Object.assign(pairing, {
      childId,
      householdId: household,
      approvedBy: store.currentUser.id,
    });
    persistDemoFamily();
  },
  async poll(secret) {
    if (USE_REAL_API.auth)
      return http.post(
        "/api/family/pairings/poll",
        { token: secret },
        { auth: false },
      );
    const pairing = demo().pairings.find((p) => p.secret === secret);
    if (
      !pairing ||
      pairing.consumed ||
      Date.parse(pairing.expiresAt) <= Date.now()
    )
      throw new Error("This pairing has ended. Create a new code.");
    if (!pairing.childId) return { pending: true };
    childInHome(pairing.householdId, pairing.childId);
    if (
      !store.members.some(
        (m) =>
          m.householdId === pairing.householdId &&
          m.userId === pairing.approvedBy &&
          m.role === "Admin",
      )
    )
      throw new Error("A parent must approve a new code.");
    pairing.consumed = true;
    persistDemoFamily();
    return session(pairing.childId, pairing.householdId, true);
  },
};
