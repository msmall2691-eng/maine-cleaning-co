import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, X, GripVertical,
  Clock, Trash2, Edit2, Check, Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ScheduledCleaning = {
  id: number;
  clientId: string;
  serviceType: string;
  scheduledDate: string;
  status: string;
  notes: string | null;
};

const SERVICE_OPTIONS = [
  { value: "standard", label: "Standard Clean", color: "bg-blue-500" },
  { value: "deep", label: "Deep Clean", color: "bg-purple-500" },
  { value: "vacation-rental", label: "Vacation Rental", color: "bg-amber-500" },
  { value: "move-in-out", label: "Move-In/Out", color: "bg-emerald-500" },
  { value: "commercial", label: "Commercial", color: "bg-rose-500" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

function getServiceColor(type: string): string {
  return SERVICE_OPTIONS.find(s => s.value === type)?.color || "bg-muted-foreground";
}

function getServiceLabel(type: string): string {
  return SERVICE_OPTIONS.find(s => s.value === type)?.label || type;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days: Date[] = [];
  for (let i = startPad - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const endPad = 7 - (days.length % 7);
  if (endPad < 7) {
    for (let i = 1; i <= endPad; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }
  return days;
}

type AddFormState = {
  date: Date;
  serviceType: string;
  preferredTime: string;
  notes: string;
};

export function ScheduleCalendar({
  cleanings,
  onCreateCleaning,
  onUpdateCleaning,
  onDeleteCleaning,
  isCreating,
  isUpdating,
}: {
  cleanings: ScheduledCleaning[];
  onCreateCleaning: (data: { serviceType: string; scheduledDate: string; preferredTime: string; notes: string }) => void;
  onUpdateCleaning: (id: number, data: { scheduledDate?: string; preferredTime?: string; notes?: string; status?: string }) => void;
  onDeleteCleaning: (id: number) => void;
  isCreating: boolean;
  isUpdating: boolean;
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [addForm, setAddForm] = useState<AddFormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);
  const [dragItemId, setDragItemId] = useState<number | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ id: number; startX: number; startY: number; date: Date | null } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleTouchStart = (cleaningId: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { id: cleaningId, startX: touch.clientX, startY: touch.clientY, date: null };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const { id, date } = touchStartRef.current;
    if (date) {
      const cleaning = cleanings.find(c => c.id === id);
      if (cleaning) {
        const oldDate = new Date(cleaning.scheduledDate);
        const newDate = new Date(date);
        newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
        onUpdateCleaning(id, { scheduledDate: newDate.toISOString() });
      }
    }
    touchStartRef.current = null;
    setDragOverDate(null);
    setDragItemId(null);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = getMonthDays(year, month);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const getCleaningsForDay = useCallback((date: Date): ScheduledCleaning[] => {
    return cleanings.filter(c => isSameDay(new Date(c.scheduledDate), date));
  }, [cleanings]);

  const handleDragStart = (e: React.DragEvent, cleaningId: number) => {
    setDragItemId(cleaningId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(cleaningId));
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.4";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDragItemId(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragOverDate || !isSameDay(dragOverDate, date)) {
      setDragOverDate(date);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const cleaningId = parseInt(e.dataTransfer.getData("text/plain"));
    if (cleaningId && !isNaN(cleaningId)) {
      const cleaning = cleanings.find(c => c.id === cleaningId);
      if (cleaning) {
        const oldDate = new Date(cleaning.scheduledDate);
        const newDate = new Date(date);
        newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
        onUpdateCleaning(cleaningId, { scheduledDate: newDate.toISOString() });
      }
    }
    setDragItemId(null);
    setDragOverDate(null);
  };

  const handleAddClick = (date: Date) => {
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast) return;
    setAddForm({ date, serviceType: "standard", preferredTime: "09:00", notes: "" });
    setExpandedDay(null);
  };

  const handleAddSubmit = () => {
    if (!addForm) return;
    onCreateCleaning({
      serviceType: addForm.serviceType,
      scheduledDate: addForm.date.toISOString(),
      preferredTime: addForm.preferredTime,
      notes: addForm.notes,
    });
    setAddForm(null);
  };

  const handleEditSave = (id: number) => {
    onUpdateCleaning(id, { notes: editNotes });
    setEditingId(null);
  };

  const statusColors: Record<string, string> = {
    upcoming: "border-blue-500/30 bg-blue-500/10",
    requested: "border-amber-500/30 bg-amber-500/10",
    completed: "border-emerald-500/30 bg-emerald-500/10",
    cancelled: "border-red-500/30 bg-red-500/08",
  };

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground section-heading-accent" data-testid="text-schedule-title">My Schedule</h1>
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs h-8" data-testid="button-today">
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8" data-testid="button-prev-month">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground min-w-[120px] sm:min-w-[140px] text-center" data-testid="text-current-month">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8" data-testid="button-next-month">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.15),0_8px_32px_rgba(0,0,0,0.08)] card-gradient-border">
        <div className="grid grid-cols-7 border-b border-border">
          {[
            { short: "S", full: "Sun" }, { short: "M", full: "Mon" }, { short: "T", full: "Tue" },
            { short: "W", full: "Wed" }, { short: "T", full: "Thu" }, { short: "F", full: "Fri" }, { short: "S", full: "Sat" }
          ].map((d, i) => (
            <div key={i} className="py-2 text-center text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="sm:hidden">{d.short}</span>
              <span className="hidden sm:inline">{d.full}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((date, idx) => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = isSameDay(date, today);
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dayCl = getCleaningsForDay(date);
            const isDragOver = dragOverDate && isSameDay(dragOverDate, date);
            const isExpanded = expandedDay && isSameDay(expandedDay, date);

            return (
              <div
                key={idx}
                className={`min-h-[56px] sm:min-h-[100px] border-b border-r border-border/50 p-0.5 sm:p-1.5 transition-colors relative group cursor-pointer sm:cursor-default
                  ${!isCurrentMonth ? "bg-secondary/30" : ""}
                  ${isToday ? "bg-primary/[0.03]" : ""}
                  ${isDragOver ? "bg-primary/[0.08] ring-2 ring-primary/20 ring-inset" : ""}
                  ${isPast && isCurrentMonth ? "opacity-60" : ""}
                `}
                onClick={() => { if (isMobile && isCurrentMonth) setExpandedDay(date); }}
                onDragOver={(e) => handleDragOver(e, date)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, date)}
                data-testid={`cell-day-${date.toISOString().split('T')[0]}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] sm:text-xs font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full
                    ${isToday ? "bg-primary text-white font-bold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/40"}
                  `}>
                    {date.getDate()}
                  </span>
                  {isCurrentMonth && !isPast && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddClick(date); }}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-all touch-manipulation"
                      data-testid={`button-add-${date.toISOString().split('T')[0]}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-0.5">
                  {dayCl.slice(0, isMobile ? 1 : 2).map(cl => (
                    <div
                      key={cl.id}
                      draggable={!isMobile && cl.status !== "completed" && cl.status !== "cancelled"}
                      onDragStart={(e) => handleDragStart(e, cl.id)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(cl.id, e)}
                      onTouchEnd={handleTouchEnd}
                      onClick={(e) => { e.stopPropagation(); setExpandedDay(date); }}
                      className={`flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded-md text-[9px] sm:text-[11px] sm:cursor-grab sm:active:cursor-grabbing border transition-all hover:shadow-sm touch-manipulation
                        ${statusColors[cl.status] || statusColors.upcoming}
                        ${dragItemId === cl.id ? "opacity-40" : ""}
                      `}
                      data-testid={`cleaning-card-${cl.id}`}
                    >
                      <GripVertical className="w-2.5 h-2.5 text-muted-foreground/30 flex-shrink-0 hidden sm:block" />
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getServiceColor(cl.serviceType)}`} />
                      <span className="truncate font-medium text-foreground/80 hidden sm:inline">{getServiceLabel(cl.serviceType)}</span>
                    </div>
                  ))}
                  {dayCl.length > (isMobile ? 1 : 2) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedDay(date); }}
                      className="text-[9px] sm:text-[10px] text-primary font-medium pl-0.5 sm:pl-1 hover:underline"
                      data-testid={`button-more-${date.toISOString().split('T')[0]}`}
                    >
                      +{dayCl.length - (isMobile ? 1 : 2)} more
                    </button>
                  )}
                  {isMobile && dayCl.length > 0 && dayCl.length <= 1 && (
                    <div className="flex gap-0.5 pl-0.5">
                      {dayCl.length === 1 && <span className="w-1 h-1 rounded-full bg-primary/40" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 px-1">
        {SERVICE_OPTIONS.map(s => (
          <span key={s.value} className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${s.color}`} />
            {s.label}
          </span>
        ))}
      </div>

      <AnimatePresence>
        {expandedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full max-h-[85vh] overflow-auto sm:max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-day-detail"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground">
                    {expandedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getCleaningsForDay(expandedDay).length} cleaning{getCleaningsForDay(expandedDay).length !== 1 ? "s" : ""} scheduled
                  </p>
                </div>
                <div className="flex gap-2">
                  {!addForm && !(expandedDay < new Date(today.getFullYear(), today.getMonth(), today.getDate())) && (
                    <Button size="sm" variant="outline" onClick={() => handleAddClick(expandedDay)} data-testid="button-add-cleaning-modal">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => setExpandedDay(null)} className="h-8 w-8">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {getCleaningsForDay(expandedDay).length === 0 && !addForm && (
                  <div className="text-center py-6">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No cleanings this day</p>
                  </div>
                )}

                {getCleaningsForDay(expandedDay).map(cl => {
                  const d = new Date(cl.scheduledDate);
                  const isEditing = editingId === cl.id;
                  return (
                    <div
                      key={cl.id}
                      className={`rounded-xl border p-3 ${statusColors[cl.status] || statusColors.upcoming}`}
                      data-testid={`detail-cleaning-${cl.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${getServiceColor(cl.serviceType)}`} />
                          <span className="font-semibold text-sm text-foreground">{getServiceLabel(cl.serviceType)}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize
                          ${cl.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                            cl.status === "cancelled" ? "bg-red-500/15 text-red-400" :
                            cl.status === "requested" ? "bg-amber-500/15 text-amber-400" :
                            "bg-blue-500/15 text-blue-400"}`}
                        >
                          {cl.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <Clock className="w-3 h-3" />
                        {formatTime(d)}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="text-sm"
                            data-testid={`input-notes-${cl.id}`}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleEditSave(cl.id)} disabled={isUpdating} data-testid={`button-save-notes-${cl.id}`}>
                              <Check className="w-3 h-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {cl.notes && <p className="text-xs text-muted-foreground bg-card/60 rounded-lg px-2 py-1.5 mb-2">{cl.notes}</p>}
                          {cl.status !== "completed" && cl.status !== "cancelled" && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => { setEditingId(cl.id); setEditNotes(cl.notes || ""); }}
                                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                data-testid={`button-edit-${cl.id}`}
                              >
                                <Edit2 className="w-3 h-3" /> Edit Notes
                              </button>
                              <button
                                onClick={() => onUpdateCleaning(cl.id, { status: "cancelled" })}
                                className="text-[11px] text-muted-foreground hover:text-red-400 flex items-center gap-1 transition-colors"
                                data-testid={`button-cancel-${cl.id}`}
                              >
                                <X className="w-3 h-3" /> Cancel
                              </button>
                              <button
                                onClick={() => onDeleteCleaning(cl.id)}
                                className="text-[11px] text-muted-foreground hover:text-red-400 flex items-center gap-1 transition-colors ml-auto"
                                data-testid={`button-delete-${cl.id}`}
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setAddForm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-add-cleaning"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-bold text-foreground">Request a Cleaning</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {addForm.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Service Type</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {SERVICE_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setAddForm(f => f ? { ...f, serviceType: s.value } : f)}
                        className={`flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg border text-sm text-left transition-all touch-manipulation min-h-[44px] sm:min-h-0
                          ${addForm.serviceType === s.value
                            ? "border-primary bg-primary/5 text-foreground font-medium"
                            : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        data-testid={`option-service-${s.value}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Preferred Time</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TIME_SLOTS.map(t => {
                      const [h] = t.split(":").map(Number);
                      const label = `${h > 12 ? h - 12 : h}:${t.split(":")[1]} ${h >= 12 ? "PM" : "AM"}`;
                      return (
                        <button
                          key={t}
                          onClick={() => setAddForm(f => f ? { ...f, preferredTime: t } : f)}
                          className={`px-2 py-2 sm:py-1.5 rounded-lg border text-xs text-center transition-all touch-manipulation min-h-[40px] sm:min-h-0
                            ${addForm.preferredTime === t
                              ? "border-primary bg-primary/5 text-foreground font-medium"
                              : "border-border text-muted-foreground hover:border-primary/30"
                            }`}
                          data-testid={`option-time-${t}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Notes (optional)</label>
                  <Input
                    value={addForm.notes}
                    onChange={(e) => setAddForm(f => f ? { ...f, notes: e.target.value } : f)}
                    placeholder="Any special instructions..."
                    className="text-sm"
                    data-testid="input-add-notes"
                  />
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t border-border">
                <Button variant="outline" className="flex-1 h-11 sm:h-10 touch-manipulation" onClick={() => setAddForm(null)} data-testid="button-cancel-add">
                  Cancel
                </Button>
                <Button className="flex-1 h-11 sm:h-10 touch-manipulation" onClick={handleAddSubmit} disabled={isCreating} data-testid="button-submit-cleaning">
                  {isCreating ? "Requesting..." : "Request Cleaning"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-400">
        <strong>Tip:</strong> Drag and drop any cleaning to a different day to reschedule. Click on a day to see details or add a new cleaning.
        Requested cleanings will be confirmed by your cleaning team.
      </div>
    </div>
  );
}
