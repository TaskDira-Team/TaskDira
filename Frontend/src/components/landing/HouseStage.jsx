import "./houseCamera.css";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Loader2,
  Utensils,
  Armchair,
  BedDouble,
  Plus,
  Minus,
  Scan,
} from "lucide-react";
import { HOUSE_ROOMS } from "./houseRooms";

export default function HouseStage({
  he,
  view,
  open = true,
  night = false,
  exploded = false,
  completed,
  replay,
  onRoomChange,
  onInteract,
  onReady,
  world,
  worldMode = false,
}) {
  const host = useRef(null);
  const markers = useRef({});
  const scene = useRef(null);
  const callbacks = useRef({ onRoomChange, onInteract, onReady });
  callbacks.current = { onRoomChange, onInteract, onReady };
  const initial = useRef({ view, open, night, exploded, completed });
  const [status, setStatus] = useState("loading");
  const [ready, setReady] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let cleanup;
    import("./houseScene")
      .then(({ createHouseScene }) => {
        if (cancelled) return;
        const instance = createHouseScene(host.current, {
          worldMode,
          onProject(points) {
            for (const [id, point] of Object.entries(points)) {
              const marker = markers.current[id];
              if (!marker) continue;
              marker.style.left = `${point.x}px`;
              marker.style.top = `${point.y}px`;
              marker.style.visibility = point.visible ? "visible" : "hidden";
            }
          },
          onInteract: () => callbacks.current.onInteract?.(),
        });
        scene.current = instance;
        const canvas = host.current.querySelector("canvas");
        const lose = (event) => {
          event.preventDefault();
          instance.dispose();
          scene.current = null;
          setStatus("error");
        };
        canvas.addEventListener("webglcontextlost", lose);
        cleanup = () => {
          canvas.removeEventListener("webglcontextlost", lose);
          instance.dispose();
          scene.current = null;
        };
        instance.setCompleted(initial.current.completed, true);
        setStatus("ready");
        setReady((value) => value + 1);
        callbacks.current.onReady?.();
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
  useEffect(() => {
    scene.current?.setRoom(view);
  }, [view, ready]);
  useEffect(() => {
    scene.current?.setOpen(open);
  }, [open, ready]);
  useEffect(() => {
    scene.current?.setNight(night);
  }, [night, ready]);
  useEffect(() => {
    scene.current?.setExploded(exploded);
  }, [exploded, ready]);
  useEffect(() => {
    if (world) scene.current?.setWorld(world);
  }, [world, ready]);
  const completedKey = completed.join(",");
  useEffect(() => {
    scene.current?.setCompleted(completed);
  }, [completedKey, ready]);
  useEffect(() => {
    if (replay?.id) scene.current?.replayQuest(replay.id);
  }, [replay?.nonce]);
  return (
    <div className={`td-house-stage ${status === "ready" ? "is-ready" : ""}`}>
      <div
        className="td-stage-canvas"
        ref={host}
        role="img"
        aria-label={
          he
            ? "בית תלת־ממדי אינטראקטיבי. גוררים לסיבוב, או משתמשים בשתי אצבעות בטלפון. כפתורי המצלמה מאפשרים להתקרב, להתרחק ולהציג את כל הבית."
            : "Interactive 3D home. Drag to rotate, or use two fingers on phones. Choose a room, zoom in or out, or show the whole house using the camera buttons."
        }
      />
      {status === "ready" && (
        <div
          className="td-camera-tools"
          role="group"
          aria-label={he ? "שליטה בתצוגה" : "House camera"}
        >
          <button
            type="button"
            onClick={() => scene.current?.zoomBy(1.25)}
            aria-label={he ? "התרחקות" : "Zoom out"}
            title={he ? "התרחקות" : "Zoom out"}
          >
            <Minus size={20} />
          </button>
          <button
            type="button"
            onClick={() => scene.current?.zoomBy(0.8)}
            aria-label={he ? "התקרבות" : "Zoom in"}
            title={he ? "התקרבות" : "Zoom in"}
          >
            <Plus size={20} />
          </button>
          <button
            type="button"
            onClick={() => {
              scene.current?.resetView();
              onRoomChange?.("home");
            }}
            aria-label={he ? "הצגת כל הבית" : "Show whole house"}
          >
            <Scan size={19} />
            <span>{he ? "כל הבית" : "Whole house"}</span>
          </button>
        </div>
      )}
      {status === "ready" && (
        <div
          className="td-house-hotspots"
          aria-label={he ? "חדרי הבית" : "Rooms in the house"}
        >
          {HOUSE_ROOMS.map((room) => (
            <button
              key={room.id}
              ref={(node) => {
                markers.current[room.id] = node;
              }}
              onClick={() => onRoomChange(room.id)}
              aria-pressed={view === room.id}
              aria-label={`${he ? "כניסה אל" : "Visit"} ${he ? room.he : room.en}`}
              style={{ visibility: "hidden" }}
            >
              <span>
                {completed.includes(room.quest) ? (
                  <Check size={14} />
                ) : worldMode ? (
                  <RoomIcon room={room.id} />
                ) : (
                  room.number
                )}
              </span>
              <strong>{he ? room.he : room.en}</strong>
            </button>
          ))}
        </div>
      )}
      {status !== "ready" && (
        <div className="td-stage-fallback">
          <img src="/images/taskdira-house.webp" alt="" />
          <div role="status">
            {status === "loading" ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {he ? "מדליקים את האור בבית…" : "Turning on the lights…"}
              </>
            ) : he ? (
              "הדפדפן לא הצליח לפתוח תלת־ממד. אפשר להמשיך לחקור דרך החדרים והמשימות."
            ) : (
              "3D could not start in this browser. You can still explore the room stories and quests."
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RoomIcon({ room }) {
  const Icon = { kitchen: Utensils, living: Armchair, bedroom: BedDouble }[
    room
  ];
  return <Icon size={19} />;
}
