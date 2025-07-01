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
    <div className="relative" data-testid="notification-bell-wrapper">
      <button
        onClick={() => setOpen(!open)}
        className="relative focus:outline-none"
        aria-label="Open notifications"
        data-testid="notification-bell-button"
      >
        <Bell className="h-6 w-6" />
        {notifications.filter(n => !n.read).length > 0 && (
          <span
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-1.5 min-w-[22px] text-center border-2 border-white shadow-lg font-bold sm:-top-1 sm:-right-1 sm:min-w-[18px] sm:px-1"
            data-testid="notification-badge"
          >
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>
      {open && (
        <div
          className="fixed bottom-0 left-0 right-0 w-full sm:absolute sm:right-0 sm:mt-2 sm:w-80 bg-white shadow-2xl rounded-t-2xl sm:rounded-xl z-[120] border border-gray-200 animate-fade-in max-h-[60vh] overflow-y-auto"
          data-testid="notification-dropdown"
        >
          <ul className="divide-y divide-gray-100">
            {notifications.length === 0 && <li className="p-6 text-gray-500 text-center">No notifications</li>}
            {notifications.map(n => (
              <li
                key={n.id}
                className={`p-5 sm:p-4 cursor-pointer transition-colors text-base sm:text-sm ${!n.read ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-50"}`}
                onClick={() => markAsRead(n.id)}
                tabIndex={0}
                aria-label={n.message}
                data-testid="notification-item"
              >
                <div className="font-medium mb-1">{n.message}</div>
                <div className="text-xs text-gray-400">{n.createdAt?.toDate?.().toLocaleString?.() || ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 