import { useEffect, useState } from "react";
import {
  User,
  Home,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";
import { FAMILY_ROLES } from "../../data/gamification";
import { DEFAULT_AVATAR_CONFIG } from "../../data/mockData";
import AvatarCreator from "./AvatarCreator";
import { useI18n } from "../../context/I18nContext";
import "./gameOnboarding.css";

const STEP_META = [
  { id: "profile", labelKey: "onboard.stepProfile", icon: User },
  { id: "household", labelKey: "onboard.stepHousehold", icon: Home },
  { id: "avatar", labelKey: "onboard.stepAvatar", icon: Sparkles },
];

/**
 * Appearance only. The steps, the validation in canProceed, and the payload
 * handed to onComplete are shared by every variant on purpose — a fork of this
 * wizard would drift from the register contract the API depends on.
 */
const GAME_THEME = {
  brandTitle: "go-brand-title",
  brandHint: "go-hint",
  stepActive: "is-current",
  stepDone: "is-done",
  stepIdle: "is-locked",
  heading: "go-heading",
  hint: "go-hint",
  label: "go-label",
  labelMuted: "go-optional",
  input: "go-input",
  select: "go-input",
  previewBox: "go-home-preview",
  previewLabel: "go-preview-label",
  previewText: "go-preview-name",
  previewNote: "go-preview-note",
  errorBox: "go-error",
  footer: "go-footer",
  backBtn: "go-back",
  primaryBtn: "go-next",
};

export default function OnboardingFlow({
  onComplete,
  onBackToLogin,
  onProgress,
  variant = "light",
  showBrand = true,
  compact = false,
}) {
  const th = GAME_THEME;
  const { t, dir, role } = useI18n();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    familyRole: "roommate",
    email: "",
    password: "",
    householdName: "",
    address: "",
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG },
  });

  useEffect(() => {
    onProgress?.({
      step,
      name: form.fullName,
      householdName: form.householdName,
      submitting,
      error,
    });
  }, [step, form.fullName, form.householdName, submitting, error, onProgress]);

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 0) {
      return (
        form.fullName.trim() &&
        form.email.trim() &&
        form.password.length >= 4 &&
        form.familyRole
      );
    }
    if (step === 1) {
      return form.householdName.trim().length > 0;
    }
    return form.avatarConfig?.baseIconId;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    setError(null);
    if (step < STEP_META.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
    else onBackToLogin?.();
  };

  const handleSubmit = async () => {
    if (submitting || !canProceed()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onComplete({
        ...form,
        fullName: form.fullName.trim(),
        name: form.fullName.trim(),
        householdName: form.householdName.trim(),
        familyRole: form.familyRole,
        avatarState: form.avatarConfig,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div dir={dir} className="game-onboarding w-full max-w-full">
      <div className="w-full max-w-lg min-w-0 mx-auto">
        {showBrand && (
          <div className="text-center mb-6 lg:hidden">
            <h1 className={th.brandTitle}>{t("brandName")}</h1>
            <p className={th.brandHint}>{t("onboard.tagline")}</p>
          </div>
        )}

        <ol className="go-checkpoint-path" aria-label={t("onboard.tagline")}>
          {STEP_META.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <li
                key={s.id}
                className={
                  isActive ? "is-current" : isDone ? "is-done" : "is-locked"
                }
              >
                <button
                  type="button"
                  className="go-checkpoint"
                  disabled={i > step || submitting}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${i + 1}. ${t(s.labelKey)}`}
                  onClick={() => {
                    setError(null);
                    setStep(i);
                  }}
                >
                  {isDone ? (
                    <Check size={24} aria-hidden="true" />
                  ) : (
                    <Icon size={24} aria-hidden="true" />
                  )}
                  <span className="go-checkpoint-number">{i + 1}</span>
                </button>
                <span className="go-checkpoint-label">{t(s.labelKey)}</span>
              </li>
            );
          })}
        </ol>

        <div className="go-stage w-full max-w-full" key={step}>
          {step === 0 && (
            <div className="go-fields space-y-4">
              <h2 className={th.heading}>{t("onboard.profileTitle")}</h2>
              <p className={th.hint}>{t("onboard.profileHint")}</p>

              <div>
                <label htmlFor="onboard-full-name" className={th.label}>
                  {t("onboard.fullName")}
                </label>
                <input
                  id="onboard-full-name"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder={t("onboard.fullNamePh")}
                  autoComplete="name"
                  className={th.input}
                />
              </div>

              <div>
                <label htmlFor="onboard-role" className={th.label}>
                  {t("onboard.role")}
                </label>
                <select
                  id="onboard-role"
                  value={form.familyRole}
                  onChange={(e) => update("familyRole", e.target.value)}
                  className={th.select}
                >
                  {FAMILY_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {role(r.id, r.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="onboard-email" className={th.label}>
                  {t("emailLabel")}
                </label>
                <input
                  id="onboard-email"
                  autoComplete="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className={th.input}
                />
              </div>

              <div>
                <label htmlFor="onboard-password" className={th.label}>
                  {t("passwordLabel")}
                </label>
                <input
                  id="onboard-password"
                  autoComplete="new-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder={t("minPassword")}
                  dir="ltr"
                  minLength={4}
                  className={th.input}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="go-fields space-y-4">
              <h2 className={th.heading}>{t("onboard.householdTitle")}</h2>
              <p className={th.hint}>{t("onboard.householdHint")}</p>

              <div>
                <label htmlFor="onboard-household" className={th.label}>
                  {t("onboard.householdName")}
                </label>
                <input
                  id="onboard-household"
                  type="text"
                  value={form.householdName}
                  onChange={(e) => update("householdName", e.target.value)}
                  placeholder={t("onboard.householdPh")}
                  className={th.input}
                />
              </div>

              <div>
                <label htmlFor="onboard-address" className={th.label}>
                  {t("onboard.address")}{" "}
                  <span className={th.labelMuted}>{t("onboard.optional")}</span>
                </label>
                <input
                  id="onboard-address"
                  type="text"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder={t("onboard.addressPh")}
                  className={th.input}
                />
              </div>

              {form.householdName.trim() && (
                <div className={th.previewBox}>
                  <p className={th.previewLabel}>{t("onboard.preview")}</p>
                  <p className={th.previewText}>
                    {form.householdName.trim()}
                    {form.address.trim() ? ` — ${form.address.trim()}` : ""}
                  </p>
                  <p className={th.previewNote}>{t("onboard.adminNote")}</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <h2 className={th.heading}>{t("onboard.avatarTitle")}</h2>
              <p className={th.hint}>{t("onboard.avatarHint")}</p>
              <AvatarCreator
                compact={compact}
                config={form.avatarConfig}
                onChange={(cfg) => update("avatarConfig", cfg)}
                variant="light"
              />
            </div>
          )}

          {error && (
            <div className={th.errorBox} role="alert">
              {error}
            </div>
          )}

          <div className={th.footer}>
            <button type="button" onClick={handleBack} className={th.backBtn}>
              <BackIcon className="h-4 w-4" />
              {step === 0 ? t("onboard.backLogin") : t("onboard.prev")}
            </button>

            {step < STEP_META.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={th.primaryBtn}
              >
                {t("onboard.next")}
                <NextIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className={th.primaryBtn}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t("onboard.finish")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
