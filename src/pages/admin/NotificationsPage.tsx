import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-2">Notifications</h1>
      <p className="text-muted-foreground text-sm mb-8">Centre de notifications</p>
      <div className="text-center py-16 text-muted-foreground">
        <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Aucune notification</p>
        <p className="text-sm">Vous serez notifié des événements importants</p>
      </div>
    </div>
  );
}
