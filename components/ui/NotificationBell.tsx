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
      <button onClick={() => setOpen(!open)} className="relative focus:outline-none">
        <Bell className="h-6 w-6" />
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1 min-w-[18px] text-center border-2 border-white shadow">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-2xl rounded-xl z-50 border border-gray-200 animate-fade-in">
          <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {notifications.length === 0 && <li className="p-4 text-gray-500">No notifications</li>}
            {notifications.map(n => (
              <li
                key={n.id}
                className={`p-4 cursor-pointer transition-colors ${!n.read ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-50"}`}
                onClick={() => markAsRead(n.id)}
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