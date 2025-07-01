import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  userId?: string;
  restaurantOwnerId?: string;
}

export function NotificationBell({ userId, restaurantOwnerId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId && !restaurantOwnerId) return;
    const q = query(
      collection(db, "notifications"),
      where(userId ? "userId" : "restaurantOwnerId", "==", userId || restaurantOwnerId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [userId, restaurantOwnerId]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell />
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs px-1">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50">
          <ul>
            {notifications.length === 0 && <li className="p-4 text-gray-500">No notifications</li>}
            {notifications.map(n => (
              <li
                key={n.id}
                className={`p-4 border-b cursor-pointer ${!n.read ? "bg-gray-100" : ""}`}
                onClick={() => markAsRead(n.id)}
              >
                {n.message}
                <div className="text-xs text-gray-400">{n.createdAt?.toDate?.().toLocaleString?.() || ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 