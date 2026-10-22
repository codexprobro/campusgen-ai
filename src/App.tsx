import {
  Sparkles,
  NotebookPen,
  ClipboardList,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Newspaper,
  Flag,
  ClipboardCheck,
  ArrowUpRight,
  Users,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Library,
  Car,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { useState, useEffect } from "react";

import "./App.css";

import { supabase } from "./supabase";

type Role = "Student" | "Faculty" | "Administrator";

type Page =
  | "landing"
  | "role"
  | "login"
  | "dashboard"
  | "ai-assistant"
  | "library"
  | "notes"
  | "assignments"
  | "timetable"
  | "attendance"
  | "campus-updates"
  | "campus-complaints"
  | "vehicle-pass"
  | "faculty-attendance"
  | "faculty-assignments"
  | "faculty-timetable"
  | "faculty-updates"
  | "faculty-complaints"
  | "admin-overview"
  | "admin-users"
  | "admin-complaints"
  | "admin-updates";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  page: Page;
};

const studentFeatures: Feature[] = [
  {
    title: "AI Assistant",
    description: "Get help with your campus and studies.",
    icon: Sparkles,
    page: "ai-assistant",
  },
  {
    title: "Library",
    description: "Track issued books, last dates, and fines.",
    icon: Library,
    page: "library",
  },
  {
    title: "My Notes",
    description: "Create and manage your notes.",
    icon: NotebookPen,
    page: "notes",
  },
  {
    title: "Assignments",
    description: "Track tasks and deadlines.",
    icon: ClipboardList,
    page: "assignments",
  },
  {
    title: "Timetable",
    description: "View your class schedule.",
    icon: CalendarDays,
    page: "timetable",
  },
  {
    title: "Attendance",
    description: "Track your attendance percentage.",
    icon: ChartNoAxesColumnIncreasing,
    page: "attendance",
  },
  {
    title: "Campus Updates",
    description: "Stay informed about campus news.",
    icon: Newspaper,
    page: "campus-updates",
  },
  {
    title: "Campus Complaints",
    description: "Report campus issues and track your complaints.",
    icon: Flag,
    page: "campus-complaints",
  },
  {
    title: "Vehicle Pass",
    description: "Enter your details and print your vehicle pass.",
    icon: Car,
    page: "vehicle-pass",
  },
];

const facultyFeatures: Feature[] = [
  {
    title: "Attendance Management",
    description: "Record and manage student attendance.",
    icon: ChartNoAxesColumnIncreasing,
    page: "faculty-attendance",
  },
  {
    title: "Assignments",
    description: "Create and manage assignments.",
    icon: ClipboardList,
    page: "faculty-assignments",
  },
  {
    title: "Timetable",
    description: "View your teaching schedule.",
    icon: CalendarDays,
    page: "faculty-timetable",
  },
  {
    title: "Campus Updates",
    description: "Publish announcements.",
    icon: Megaphone,
    page: "faculty-updates",
  },
  {
    title: "Student Complaints",
    description: "Review submitted campus issues.",
    icon: Flag,
    page: "faculty-complaints",
  },
];

const adminFeatures: Feature[] = [
  {
    title: "Overview",
    description: "View the administrative dashboard.",
    icon: LayoutDashboard,
    page: "admin-overview",
  },
  {
    title: "User Management",
    description: "Manage campus user information.",
    icon: Users,
    page: "admin-users",
  },
  {
    title: "Complaint Management",
    description: "Monitor and manage complaints.",
    icon: ShieldCheck,
    page: "admin-complaints",
  },
  {
    title: "Campus Updates",
    description: "Manage campus announcements.",
    icon: Megaphone,
    page: "admin-updates",
  },
];

const pageTitles: Record<Page, string> = {
  landing: "Welcome",
  role: "Choose your role",
  login: "Sign in",
  dashboard: "Dashboard",
  "ai-assistant": "AI Assistant",
  library: "Library",
  notes: "My Notes",
  assignments: "Assignments",
  timetable: "Timetable",
  attendance: "Attendance",
  "campus-updates": "Campus Updates",
  "campus-complaints": "Campus Complaints",
  "vehicle-pass": "Vehicle Pass",
  "faculty-attendance": "Attendance Management",
  "faculty-assignments": "Assignment Management",
  "faculty-timetable": "Faculty Timetable",
  "faculty-updates": "Campus Updates",
  "faculty-complaints": "Student Complaints",
  "admin-overview": "Administrative Overview",
  "admin-users": "User Management",
  "admin-complaints": "Complaint Management",
  "admin-updates": "Campus Updates",
};

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type Assignment = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  description: string;
  completed: boolean;
  attachment?: {
    name: string;
    dataUrl: string;
  };
};

type LibraryEntry = {
  id: string;
  book: string;
  lastDate: string;
  fine: number;
};

type ClassPoll = {
  yes: number;
  no: number;
  myVote: "yes" | "no" | null;
};

type ClassEntry = {
  id: string;
  subject: string;
  teacher: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
};

type AttendanceRecord = {
  id: string;
  subject: string;
  attended: number;
  total: number;
};

type Complaint = {
  id: string;
  referenceId: string;
  category: string;
  location: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  status:
    | "Submitted"
    | "Submited"
    | "Under Review"
    | "In Progress"
    | "Resolved"
    | "Rejected";
  createdAt: string;
};

type CampusUpdate = {
  id: string;
  title: string;
  category: string;
  message: string;
  publishedAt: string;
  important: boolean;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function App() {
  const [page, setPage] = useState<Page>("landing");
  const [role, setRole] = useState<Role>("Student");

  const [college, setCollege] = useState("");
  const [userName, setUserName] = useState("");
  const [loginError, setLoginError] = useState("");

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const savedNotes = localStorage.getItem("campusgen-notes");
      return savedNotes ? JSON.parse(savedNotes) as Note[] : [];
    } catch {
      return [];
    }
  });

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem("campusgen-assignments");
      return saved ? JSON.parse(saved) as Assignment[] : [];
    } catch {
      return [];
    }
  });

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentSubject, setAssignmentSubject] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [assignmentFileKey, setAssignmentFileKey] = useState(0);

  const [libraryItems, setLibraryItems] = useState<LibraryEntry[]>(() => {
    try {
      const saved = localStorage.getItem("campusgen-library");
      return saved ? JSON.parse(saved) as LibraryEntry[] : [];
    } catch {
      return [];
    }
  });

  const [libraryBook, setLibraryBook] = useState("");
  const [libraryLastDate, setLibraryLastDate] = useState("");
  const [libraryFine, setLibraryFine] = useState("0");

  const [vehicleName, setVehicleName] = useState("");
  const [vehicleLicense, setVehicleLicense] = useState("");
  const [vehicleAadhaar, setVehicleAadhaar] = useState("");
  const [vehiclePassIssued, setVehiclePassIssued] = useState("No");

  const [classPoll, setClassPoll] = useState<ClassPoll>(() => {
    try {
      const saved = localStorage.getItem("campusgen-class-poll");
      return saved
        ? JSON.parse(saved) as ClassPoll
        : { yes: 0, no: 0, myVote: null };
    } catch {
      return { yes: 0, no: 0, myVote: null };
    }
  });

  const [timetable, setTimetable] = useState<ClassEntry[]>(() => {
    try {
      const saved = localStorage.getItem("campusgen-timetable");
      return saved ? JSON.parse(saved) as ClassEntry[] : [];
    } catch {
      return [];
    }
  });

  const [attendanceRecords, setAttendanceRecords] =
    useState<AttendanceRecord[]>(() => {
      try {
        const saved = localStorage.getItem("campusgen-attendance");
        return saved ? JSON.parse(saved) as AttendanceRecord[] : [];
      } catch {
        return [];
      }
    });

  const [classSubject, setClassSubject] = useState("");
  const [classTeacher, setClassTeacher] = useState("");
  const [classDay, setClassDay] = useState("Monday");
  const [classStartTime, setClassStartTime] = useState("09:00");
  const [classEndTime, setClassEndTime] = useState("10:00");
  const [classRoom, setClassRoom] = useState("");

  const [attendanceSubject, setAttendanceSubject] = useState("");
  const [attendanceAttended, setAttendanceAttended] = useState(0);
  const [attendanceTotal, setAttendanceTotal] = useState(0);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [adminComplaints, setAdminComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (page === "admin-complaints") loadAdminComplaints();
  }, [page]);

  async function loadAdminComplaints() {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Could not load complaints: " + error.message);
      return;
    }

    setAdminComplaints(
      (data ?? []).map((item) => ({
        id: item.reference_id,
        referenceId: item.reference_id,
        category: item.category,
        location: item.location,
        description: item.description,
        priority: item.priority,
        status: item.status,
        createdAt: item.created_at,
      }))
    );
  }

  async function updateComplaintStatus(
    referenceId: string,
    status: Complaint["status"]
  ) {
    const { error } = await supabase
      .from("complaints")
      .update({ status })
      .eq("reference_id", referenceId);

    if (error) {
      alert("Could not update status: " + error.message);
      return;
    }

    setAdminComplaints((previous) =>
      previous.map((c) =>
        c.referenceId === referenceId ? { ...c, status } : c
      )
    );
  }

  useEffect(() => {
    async function loadComplaints() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.log("Please sign in to load complaints.");
        return;
      }

      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load complaints:", error.message);
        return;
      }

      const cloudComplaints: Complaint[] = (data ?? []).map((item) => ({
        id: item.reference_id,
        referenceId: item.reference_id,
        category: item.category,
        location: item.location,
        description: item.description,
        priority: item.priority,
        status: item.status,
        createdAt: item.created_at,
      }));

      setComplaints(cloudComplaints);
    }

    loadComplaints();
  }, []);

  const [complaintCategory, setComplaintCategory] = useState("Cleanliness");
  const [complaintLocation, setComplaintLocation] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintPriority, setComplaintPriority] =
    useState<Complaint["priority"]>("Medium");

  const [campusUpdates, setCampusUpdates] = useState<CampusUpdate[]>(() => {
    try {
      const saved = localStorage.getItem("campusgen-updates");
      return saved ? JSON.parse(saved) as CampusUpdate[] : [];
    } catch {
      return [];
    }
  });

  const [updateTitle, setUpdateTitle] = useState("");
  const [updateCategory, setUpdateCategory] = useState("Announcements");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateImportant, setUpdateImportant] = useState(false);

  useEffect(() => {
    localStorage.setItem("campusgen-notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "campusgen-assignments",
        JSON.stringify(assignments)
      );
    } catch {
      alert(
        "Browser storage is full, so the latest assignment could not be saved. Try a smaller document."
      );
    }
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem("campusgen-library", JSON.stringify(libraryItems));
  }, [libraryItems]);

  useEffect(() => {
    localStorage.setItem("campusgen-class-poll", JSON.stringify(classPoll));
  }, [classPoll]);

  useEffect(() => {
    localStorage.setItem(
      "campusgen-timetable",
      JSON.stringify(timetable)
    );
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem(
      "campusgen-attendance",
      JSON.stringify(attendanceRecords)
    );
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(
      "campusgen-updates",
      JSON.stringify(campusUpdates)
    );
  }, [campusUpdates]);

  function saveNote() {
    const title = noteTitle.trim();
    const content = noteContent.trim();

    if (!title || !content) {
      alert("Please enter both a title and note content.");
      return;
    }

    const updatedAt = new Date().toLocaleString();

    if (editingNoteId) {
      setNotes((previousNotes) =>
        previousNotes.map((note) =>
          note.id === editingNoteId
            ? { ...note, title, content, updatedAt }
            : note
        )
      );
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        updatedAt,
      };

      setNotes((previousNotes) => [newNote, ...previousNotes]);
    }

    setNoteTitle("");
    setNoteContent("");
    setEditingNoteId(null);
  }

  function editNote(note: Note) {
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setEditingNoteId(note.id);
  }

  function deleteNote(id: string) {
    if (!window.confirm("Delete this note permanently?")) return;

    setNotes((previousNotes) =>
      previousNotes.filter((note) => note.id !== id)
    );

    if (editingNoteId === id) {
      setNoteTitle("");
      setNoteContent("");
      setEditingNoteId(null);
    }
  }

  function cancelNoteEdit() {
    setNoteTitle("");
    setNoteContent("");
    setEditingNoteId(null);
  }

  // ================================
  // ASSIGNMENTS
  // ================================

  async function addAssignment() {
    if (!assignmentTitle.trim() || !assignmentSubject.trim() || !assignmentDueDate) {
      alert("Please enter the assignment title, subject, and deadline.");
      return;
    }

    let attachment: Assignment["attachment"];

    if (assignmentFile) {
      if (assignmentFile.size > 2 * 1024 * 1024) {
        alert("Please upload a document smaller than 2 MB.");
        return;
      }

      try {
        attachment = {
          name: assignmentFile.name,
          dataUrl: await readFileAsDataUrl(assignmentFile),
        };
      } catch {
        alert("Could not read the selected document. Please try again.");
        return;
      }
    }

    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      title: assignmentTitle.trim(),
      subject: assignmentSubject.trim(),
      dueDate: assignmentDueDate,
      description: assignmentDescription.trim(),
      completed: false,
      attachment,
    };

    setAssignments((previous) => [newAssignment, ...previous]);

    setAssignmentTitle("");
    setAssignmentSubject("");
    setAssignmentDueDate("");
    setAssignmentDescription("");
    setAssignmentFile(null);
    setAssignmentFileKey((key) => key + 1);
  }

  function toggleAssignment(id: string) {
    setAssignments((previous) =>
      previous.map((assignment) =>
        assignment.id === id
          ? { ...assignment, completed: !assignment.completed }
          : assignment
      )
    );
  }

  function deleteAssignment(id: string) {
    if (!window.confirm("Delete this assignment?")) return;

    setAssignments((previous) =>
      previous.filter((assignment) => assignment.id !== id)
    );
  }

  // ================================
  // LIBRARY
  // ================================

  function addLibraryEntry() {
    const book = libraryBook.trim();
    const fine = Number(libraryFine);

    if (!book || !libraryLastDate) {
      alert("Please enter the issued book and its last date.");
      return;
    }

    if (!Number.isFinite(fine) || fine < 0) {
      alert("Please enter a valid fine amount (0 or more).");
      return;
    }

    const newEntry: LibraryEntry = {
      id: crypto.randomUUID(),
      book,
      lastDate: libraryLastDate,
      fine,
    };

    setLibraryItems((previous) =>
      [...previous, newEntry].sort((a, b) =>
        a.lastDate.localeCompare(b.lastDate)
      )
    );

    setLibraryBook("");
    setLibraryLastDate("");
    setLibraryFine("0");
  }

  function deleteLibraryEntry(id: string) {
    if (!window.confirm("Remove this book from your library record?")) return;

    setLibraryItems((previous) =>
      previous.filter((entry) => entry.id !== id)
    );
  }

  // ================================
  // VEHICLE PASS
  // ================================

  function printVehiclePass() {
    const name = vehicleName.trim();
    const license = vehicleLicense.trim();
    const aadhaarDigits = vehicleAadhaar.replace(/\s/g, "");

    if (!name || !license) {
      alert("Please enter your name and license number.");
      return;
    }

    if (!/^\d{12}$/.test(aadhaarDigits)) {
      alert("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    if (vehiclePassIssued !== "Yes") {
      alert("Your pass has not been issued yet. Set \"Pass issued\" to Yes to print it.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=520,height=680");

    if (!printWindow) {
      alert("Please allow pop-ups so your pass can be printed.");
      return;
    }

    const maskedAadhaar = `XXXX XXXX ${aadhaarDigits.slice(-4)}`;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Vehicle Pass</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #202b3c; }
  .pass { max-width: 420px; margin: 0 auto; border: 2px solid #356ae6; border-radius: 14px; padding: 28px; }
  h1 { margin: 0 0 4px; font-size: 22px; color: #356ae6; }
  .sub { margin: 0 0 22px; font-size: 12px; color: #788396; }
  .row { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-top: 1px solid #e7ebf1; font-size: 14px; }
  .row span:first-child { color: #788396; }
  .status { margin-top: 18px; text-align: center; font-weight: bold; color: #16a34a; }
</style>
</head>
<body>
  <div class="pass">
    <h1>CampusGen AI</h1>
    <p class="sub">Vehicle Pass${college ? " — " + escapeHtml(college) : ""}</p>
    <div class="row"><span>Name</span><span>${escapeHtml(name)}</span></div>
    <div class="row"><span>License</span><span>${escapeHtml(license)}</span></div>
    <div class="row"><span>Aadhaar</span><span>${maskedAadhaar}</span></div>
    <div class="row"><span>Role</span><span>${escapeHtml(role)}</span></div>
    <div class="row"><span>Pass issued</span><span>Yes</span></div>
    <p class="status">PASS ISSUED</p>
  </div>
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  }

  // ================================
  // EXTRA CLASS POLL
  // ================================

  function voteClassPoll(choice: "yes" | "no") {
    setClassPoll((previous) => {
      if (previous.myVote === choice) return previous;

      let yes = previous.yes;
      let no = previous.no;

      if (previous.myVote === "yes") yes -= 1;
      if (previous.myVote === "no") no -= 1;

      if (choice === "yes") yes += 1;
      else no += 1;

      return { yes, no, myVote: choice };
    });
  }

  // ================================
  // TIMETABLE
  // ================================

  function addClass() {
    if (!classSubject.trim() || !classStartTime || !classEndTime) {
      alert("Please enter the subject and both class times.");
      return;
    }

    if (classEndTime <= classStartTime) {
      alert("The class end time must be later than its start time.");
      return;
    }

    const newClass: ClassEntry = {
      id: crypto.randomUUID(),
      subject: classSubject.trim(),
      teacher: classTeacher.trim(),
      day: classDay,
      startTime: classStartTime,
      endTime: classEndTime,
      room: classRoom.trim(),
    };

    setTimetable((previous) =>
      [...previous, newClass].sort(
        (a, b) =>
          ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
"Sunday"].indexOf(a.day) -
          ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
"Sunday"].indexOf(b.day) ||
          a.startTime.localeCompare(b.startTime)
      )
    );

    setClassSubject("");
    setClassTeacher("");
    setClassDay("Monday");
    setClassStartTime("09:00");
    setClassEndTime("10:00");
    setClassRoom("");
  }

  function deleteClass(id: string) {
    if (!window.confirm("Remove this class from your timetable?")) return;

    setTimetable((previous) =>
      previous.filter((entry) => entry.id !== id)
    );
  }

  // ================================
  // ATTENDANCE
  // ================================

  function addAttendanceRecord() {
    const subject = attendanceSubject.trim();

    if (!subject) {
      alert("Please enter a subject.");
      return;
    }

    if (
      !Number.isInteger(attendanceAttended) ||
      !Number.isInteger(attendanceTotal) ||
      attendanceTotal < 1 ||
      attendanceAttended < 0 ||
      attendanceAttended > attendanceTotal
    ) {
      alert("Enter valid attendance counts. Attended classes cannot exceed total classes.");
      return;
    }

    setAttendanceRecords((previous) => {
      const existing = previous.find(
        (record) => record.subject.toLowerCase() === subject.toLowerCase()
      );

      if (existing) {
        return previous.map((record) =>
          record.id === existing.id
            ? {
                ...record,
                attended: attendanceAttended,
                total: attendanceTotal,
              }
            : record
        );
      }

      return [
        ...previous,
        {
          id: crypto.randomUUID(),
          subject,
          attended: attendanceAttended,
          total: attendanceTotal,
        },
      ];
    });

    setAttendanceSubject("");
    setAttendanceAttended(0);
    setAttendanceTotal(0);
  }

  function deleteAttendanceRecord(id: string) {
    if (!window.confirm("Delete this attendance record?")) return;

    setAttendanceRecords((previous) =>
      previous.filter((record) => record.id !== id)
    );
  }

  async function addComplaint() {
    if (!complaintLocation.trim() || !complaintDescription.trim()) {
      alert("Please enter the location and complaint description.");
      return;
    }

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        alert("Please sign in before submitting a complaint.");
        return;
      }

      const referenceId = `CG-${Date.now()
        .toString(36)
        .toUpperCase()}`;

      const { data, error } = await supabase
        .from("complaints")
        .insert({
          reference_id: referenceId,
          user_id: userData.user.id,
          institution: college || "Unknown Institution",
          category: complaintCategory,
          location: complaintLocation.trim(),
          description: complaintDescription.trim(),
          priority: complaintPriority,
          status: "Submitted",
        })
        .select()
        .single();

      if (error) {
        console.error("Complaint submission failed:", error);
        alert(`Could not submit complaint: ${error.message}`);
        return;
      }

      const newComplaint: Complaint = {
        id: data.reference_id,
        referenceId: data.reference_id,
        category: data.category,
        location: data.location,
        description: data.description,
        priority: data.priority,
        status: data.status,
        createdAt: data.created_at,
      };

      setComplaints((previous) => [newComplaint, ...previous]);

      setComplaintLocation("");
      setComplaintDescription("");
      setComplaintPriority("Medium");

      alert(
        `Complaint submitted successfully!\nReference ID: ${referenceId}`
      );
    } catch (error) {
      console.error("Unexpected complaint error:", error);
      alert("Something went wrong. Please try again.");
    }
  }

  function deleteComplaint(id: string) {
    if (!window.confirm("Delete this complaint from your browser?")) return;

    setComplaints((previous) =>
      previous.filter((complaint) => complaint.id !== id)
    );
  }

  function addCampusUpdate() {
    if (!updateTitle.trim() || !updateMessage.trim()) {
      alert("Please enter an announcement title and message.");
      return;
    }

    const newUpdate: CampusUpdate = {
      id: crypto.randomUUID(),
      title: updateTitle.trim(),
      category: updateCategory,
      message: updateMessage.trim(),
      publishedAt: new Date().toISOString(),
      important: updateImportant,
    };

    setCampusUpdates((previous) => [newUpdate, ...previous]);

    setUpdateTitle("");
    setUpdateCategory("Announcements");
    setUpdateMessage("");
    setUpdateImportant(false);

    alert("Campus update added successfully!");
  }

  function deleteCampusUpdate(id: string) {
    if (!window.confirm("Delete this campus update?")) return;

    setCampusUpdates((previous) =>
      previous.filter((update) => update.id !== id)
    );
  }

  const features: Feature[] =
    role === "Student"
      ? studentFeatures
      : role === "Faculty"
        ? facultyFeatures
        : adminFeatures;

  async function signOut() {
    await supabase.auth.signOut();
    setUserName("");
    setLoginError("");
    setComplaints([]);
    setAdminComplaints([]);
    setPage("landing");
  }

  async function handleLogin(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");

    const form = event.currentTarget;
    const data = new FormData(form);

    const enteredEmail = String(data.get("email") ?? "").trim();
    const enteredPassword = String(data.get("password") ?? "");

    if (!enteredEmail || !enteredPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: enteredEmail,
      password: enteredPassword,
    });

    if (error) {
      setLoginError(error.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (role === "Administrator" && profile?.role !== "Administrator") {
      await supabase.auth.signOut();
      setLoginError("This account does not have administrator access.");
      return;
    }

    const displayName =
      authData.user?.user_metadata?.full_name ||
      enteredEmail.split("@")[0];

    setUserName(displayName);
    setPage("dashboard");
  }

  function goBack() {
    if (page === "dashboard") {
      signOut();
      return;
    }

    if (page === "login") {
      setPage("role");
      return;
    }

    if (page === "role") {
      setPage("landing");
      return;
    }

    setPage("dashboard");
  }

  function renderDashboard() {
    return (
      <div className="dashboard-layout">
        <aside className="sidebar">
          <button
            className="brand sidebar-brand"
            onClick={() => setPage("dashboard")}
            type="button"
          >
            <span className="brand-mark">C</span>
            <span>
              CampusGen <strong>AI</strong>
            </span>
          </button>

          <div className="sidebar-section-label">WORKSPACE</div>

          <button
            className="sidebar-link active"
            onClick={() => setPage("dashboard")}
            type="button"
          >
            <span>▦</span> Dashboard
          </button>

          {features.map((feature) => (
            <button
              className="sidebar-link"
              key={feature.page}
              onClick={() => setPage(feature.page)}
              type="button"
            >
              <span className="sidebar-icon">
                <feature.icon size={20} strokeWidth={1.8} />
              </span>
              {feature.title}
            </button>
          ))}

          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="user-avatar">
                {(userName || role).charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{userName || role}</strong>
                <span>{role}</span>
              </div>
            </div>

            <button
              className="sidebar-link signout-button"
              onClick={signOut}
              type="button"
            >
              ↪ Sign out
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="topbar">
            <div>
              <span className="breadcrumb">Workspace /</span>
              <strong> {pageTitles[page]}</strong>
            </div>

            <div className="topbar-right">
              <span className="college-label">
                {college || "Your Campus"}
              </span>
              <div className="user-avatar small-avatar">
                {(userName || role).charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {page === "dashboard" ? (
            <section className="dashboard-content">
              <div className="welcome-section">
                <div>
                  <span className="eyebrow">CAMPUSGEN AI WORKSPACE</span>
                  <h1>Welcome back{userName ? `, ${userName}` : ""}.</h1>
                  <p>
                    Everything you need for a smarter campus experience,
                    all in one place.
                  </p>
                </div>

                <div className="welcome-badge">
                  <span className="status-dot" />
                  {role} workspace
                </div>
              </div>

              <div className="dashboard-heading">
                <div>
                  <h2>Your workspace</h2>
                  <p>Select a feature to get started.</p>
                </div>
                <span className="feature-count">
                  {features.length} features
                </span>
              </div>

              <div className="feature-grid">
                {features.map((feature, index) => (
                  <button
                    className="feature-card"
                    key={feature.page}
                    onClick={() => setPage(feature.page)}
                    type="button"
                  >
                    <div className="feature-card-top">
                      <span className="feature-icon">
                        <feature.icon size={25} strokeWidth={1.8} />
                      </span>

                      <span className="card-arrow">
                        <ArrowUpRight size={18} strokeWidth={1.8} />
                      </span>
                    </div>

                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>

                    <div className="feature-card-bottom">
                      <span>Open feature</span>
                      <span className="feature-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="dashboard-note">
                <span className="note-icon">✦</span>
                <div>
                  <strong>Your campus, organized.</strong>
                  <p>
                    Manage your academic activities and campus services
                    from one workspace.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="feature-page">
              <button
                className="back-button"
                onClick={goBack}
                type="button"
              >
                ← Back to Dashboard
              </button>

              <div className="feature-page-heading">
                <span className="eyebrow">{role.toUpperCase()} WORKSPACE</span>
                <h1>{pageTitles[page]}</h1>
                <p>
                  Your {pageTitles[page].toLowerCase()} workspace is ready
                  for the next implementation stage.
                </p>
              </div>

              {page === "ai-assistant" ? (
                <div className="coming-soon-panel ai-assistant-panel">
                  <span className="feature-page-icon">
                    <Sparkles size={24} strokeWidth={1.8} />
                  </span>

                  <h2>CampusGen AI Assistant</h2>

                  <p>
                    Your study companion for programming, engineering subjects,
                    assignments, and campus questions.
                  </p>

                  <div className="ai-chat-box">
                    <div className="ai-message">
                      Hello! I'm your CampusGen study assistant. What would you
                      like help with today?
                    </div>

                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const input = event.currentTarget.elements.namedItem(
                          "question"
                        ) as HTMLInputElement;

                        if (!input.value.trim()) return;

                        alert(
                          "Your question was received: " + input.value.trim() +
                          "\n\nReal AI responses will be connected in the next step."
                        );
                        input.value = "";
                      }}
                      className="ai-chat-form"
                    >
                      <input
                        name="question"
                        type="text"
                        placeholder="Ask a study question..."
                        aria-label="Ask a study question"
                      />

                      <button className="primary-button" type="submit">
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              ) : page === "assignments" ? (
                <div className="notes-workspace">
                  <div className="notes-intro">
                    <span className="eyebrow">YOUR ACADEMIC WORKSPACE</span>
                    <h2>Assignments</h2>
                    <p>Organize deadlines, track your work, and complete assignments on time.</p>
                  </div>

                  <div className="notes-editor">
                    <label htmlFor="assignment-title">Assignment title</label>
                    <input
                      id="assignment-title"
                      value={assignmentTitle}
                      onChange={(event) => setAssignmentTitle(event.target.value)}
                      placeholder="e.g. Data Structures Assignment"
                    />

                    <label htmlFor="assignment-subject">Subject</label>
                    <input
                      id="assignment-subject"
                      value={assignmentSubject}
                      onChange={(event) => setAssignmentSubject(event.target.value)}
                      placeholder="e.g. Computer Programming"
                    />

                    <label htmlFor="assignment-due-date">Deadline</label>
                    <input
                      id="assignment-due-date"
                      type="date"
                      min={new Date().toLocaleDateString("en-CA")}
                      value={assignmentDueDate}
                      onChange={(event) => setAssignmentDueDate(event.target.value)}
                    />

                    <label htmlFor="assignment-description">Description (optional)</label>
                    <textarea
                      id="assignment-description"
                      rows={3}
                      value={assignmentDescription}
                      onChange={(event) => setAssignmentDescription(event.target.value)}
                      placeholder="Add assignment instructions..."
                    />

                    <label htmlFor="assignment-file">Upload document (optional, max 2 MB)</label>
                    <input
                      key={assignmentFileKey}
                      id="assignment-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                      onChange={(event) =>
                        setAssignmentFile(event.target.files?.[0] ?? null)
                      }
                    />

                    <button
                      className="primary-button"
                      type="button"
                      onClick={addAssignment}
                    >
                      Add Assignment
                    </button>
                  </div>

                  <div className="saved-notes-heading">
                    <h2>Your Assignments</h2>
                    <span>{assignments.filter((item) => !item.completed).length} pending</span>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="empty-notes">
                      <ClipboardList size={30} />
                      <h3>No assignments yet</h3>
                      <p>Add your first assignment using the form above.</p>
                    </div>
                  ) : (
                    <div className="saved-notes-grid">
                      {assignments.map((assignment) => (
                        <article className="saved-note-card" key={assignment.id}>
                          <h3>{assignment.title}</h3>
                          <p><strong>Subject:</strong> {assignment.subject}</p>
                          <p><strong>Deadline:</strong> {assignment.dueDate}</p>
                          {assignment.description && <p>{assignment.description}</p>}
                          {assignment.attachment && (
                            <p>
                              <strong>Document:</strong>{" "}
                              <a
                                href={assignment.attachment.dataUrl}
                                download={assignment.attachment.name}
                              >
                                {assignment.attachment.name}
                              </a>
                            </p>
                          )}
                          <p>
                            Status: {assignment.completed ? "Completed" : "Pending"}
                          </p>

                          <div className="saved-note-actions">
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => toggleAssignment(assignment.id)}
                            >
                              {assignment.completed ? "Mark Pending" : "Mark Complete"}
                            </button>

                            <button
                              className="secondary-button delete-note-button"
                              type="button"
                              onClick={() => deleteAssignment(assignment.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : page === "library" ? (
                <div className="notes-workspace">
                  <div className="notes-intro">
                    <span className="eyebrow">YOUR LIBRARY</span>
                    <h2>Library</h2>
                    <p>Keep track of issued books, their last dates, and any fine due.</p>
                  </div>

                  <div className="notes-editor">
                    <label htmlFor="library-book">Book issued</label>
                    <input
                      id="library-book"
                      value={libraryBook}
                      onChange={(event) => setLibraryBook(event.target.value)}
                      placeholder="e.g. Introduction to Algorithms"
                    />

                    <label htmlFor="library-last-date">Last date</label>
                    <input
                      id="library-last-date"
                      type="date"
                      value={libraryLastDate}
                      onChange={(event) => setLibraryLastDate(event.target.value)}
                    />

                    <label htmlFor="library-fine">Fine due (₹)</label>
                    <input
                      id="library-fine"
                      type="number"
                      min={0}
                      step={1}
                      value={libraryFine}
                      onChange={(event) => setLibraryFine(event.target.value)}
                    />

                    <button
                      className="primary-button"
                      type="button"
                      onClick={addLibraryEntry}
                    >
                      Add Book
                    </button>
                  </div>

                  <div className="saved-notes-heading">
                    <h2>Your Books</h2>
                    <span>
                      {libraryItems.length} issued · Total fine due: ₹
                      {libraryItems.reduce((sum, entry) => sum + entry.fine, 0)}
                    </span>
                  </div>

                  {libraryItems.length === 0 ? (
                    <div className="empty-notes">
                      <Library size={30} />
                      <h3>No books issued yet</h3>
                      <p>Add your first issued book using the form above.</p>
                    </div>
                  ) : (
                    <div className="saved-notes-grid">
                      {libraryItems.map((entry) => (
                        <article className="saved-note-card" key={entry.id}>
                          <h3>{entry.book}</h3>
                          <p><strong>Last date:</strong> {entry.lastDate}</p>
                          <p><strong>Fine due:</strong> ₹{entry.fine}</p>

                          <button
                            className="secondary-button delete-note-button"
                            type="button"
                            onClick={() => deleteLibraryEntry(entry.id)}
                          >
                            Remove Book
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : page === "vehicle-pass" ? (
                <div className="notes-workspace">
                  <div className="notes-intro">
                    <span className="eyebrow">CAMPUS SERVICES</span>
                    <h2>Vehicle Pass</h2>
                    <p>Enter your details and print your vehicle pass.</p>
                  </div>

                  <div className="notes-editor">
                    <label htmlFor="vehicle-name">Name</label>
                    <input
                      id="vehicle-name"
                      value={vehicleName}
                      onChange={(event) => setVehicleName(event.target.value)}
                      placeholder="Full name"
                    />

                    <label htmlFor="vehicle-license">License number</label>
                    <input
                      id="vehicle-license"
                      value={vehicleLicense}
                      onChange={(event) => setVehicleLicense(event.target.value)}
                      placeholder="Driving license number"
                    />

                    <label htmlFor="vehicle-aadhaar">Aadhaar number</label>
                    <input
                      id="vehicle-aadhaar"
                      inputMode="numeric"
                      maxLength={14}
                      value={vehicleAadhaar}
                      onChange={(event) => setVehicleAadhaar(event.target.value)}
                      placeholder="12-digit Aadhaar number"
                    />

                    <label htmlFor="vehicle-pass-issued">Pass issued</label>
                    <select
                      id="vehicle-pass-issued"
                      value={vehiclePassIssued}
                      onChange={(event) => setVehiclePassIssued(event.target.value)}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>

                    <button
                      className="primary-button"
                      type="button"
                      onClick={printVehiclePass}
                    >
                      Print Pass
                    </button>
                  </div>
                </div>
              ) : page === "timetable" ? (
                <div className="notes-workspace">
                  <div className="notes-intro">
                    <span className="eyebrow">YOUR CLASS SCHEDULE</span>
                    <h2>Timetable</h2>
                    <p>Organize your weekly classes in one place.</p>
                  </div>

                  <div className="notes-editor">
                    <label htmlFor="class-subject">Subject</label>
                    <input
                      id="class-subject"
                      value={classSubject}
                      onChange={(event) => setClassSubject(event.target.value)}
                      placeholder="e.g. Engineering Mathematics"
                    />

                    <label htmlFor="class-teacher">Teacher (optional)</label>
                    <input
                      id="class-teacher"
                      value={classTeacher}
                      onChange={(event) => setClassTeacher(event.target.value)}
                      placeholder="Teacher's name"
                    />

                    <label htmlFor="class-day">Day</label>
                    <select
                      id="class-day"
                      value={classDay}
                      onChange={(event) => setClassDay(event.target.value)}
                    >
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
"Sunday"].map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>

                    <label htmlFor="class-start">Start time</label>
                    <input
                      id="class-start"
                      type="time"
                      value={classStartTime}
                      onChange={(event) => setClassStartTime(event.target.value)}
                    />

                    <label htmlFor="class-end">End time</label>
                    <input
                      id="class-end"
                      type="time"
                      value={classEndTime}
                      onChange={(event) => setClassEndTime(event.target.value)}
                    />

                    <label htmlFor="class-room">Room (optional)</label>
                    <input
                      id="class-room"
                      value={classRoom}
                      onChange={(event) => setClassRoom(event.target.value)}
                      placeholder="e.g. Room 204"
                    />

                    <button className="primary-button" type="button" onClick={addClass}>
                      Add Class
                    </button>
                  </div>

                  <div className="saved-notes-heading">
                    <h2>Weekly Schedule</h2>
                    <span>{timetable.length} classes</span>
                  </div>

                  {timetable.length === 0 ? (
                    <div className="empty-notes">
                      <CalendarDays size={30} />
                      <h3>No classes scheduled</h3>
                      <p>Add your first class using the form above.</p>
                    </div>
                  ) : (
                    <div className="saved-notes-grid">
                      {timetable.map((entry) => (
                        <article className="saved-note-card" key={entry.id}>
                          <h3>{entry.subject}</h3>
                          <p><strong>Day:</strong> {entry.day}</p>
                          <p><strong>Time:</strong> {entry.startTime}–{entry.endTime}</p>
                          {entry.teacher && <p><strong>Teacher:</strong> {entry.teacher}</p>}
                          {entry.room && <p><strong>Room:</strong> {entry.room}</p>}

                          <button
                            className="secondary-button delete-note-button"
                            type="button"
                            onClick={() => deleteClass(entry.id)}
                          >
                            Remove Class
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : page === "campus-complaints" ? (
                <div className="notes-workspace">
                  <div className="notes-intro">
                    <span className="eyebrow">CAMPUS IMPROVEMENT</span>
                    <h2>Campus Complaints</h2>
                    <p>
                      Report campus issues so they can be tracked and addressed.
                    </p>
                  </div>

                  <div className="notes-editor">
                    <label htmlFor="complaint-category">Issue category</label>
                    <select
                      id="complaint-category"
                      value={complaintCategory}
                      onChange={(event) => setComplaintCategory(event.target.value)}
                    >
                      <option value="Cleanliness">Cleanliness</option>
                      <option value="Water Supply">Water Supply</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Classroom Equipment">Classroom Equipment</option>
                      <option value="Wi-Fi / Internet">Wi-Fi / Internet</option>
                      <option value="Washroom">Washroom</option>
                      <option value="Safety">Safety</option>
                      <option value="Other">Other</option>
                    </select>

                    <label htmlFor="complaint-location">Location</label>
                    <input
                      id="complaint-location"
                      value={complaintLocation}
                      onChange={(event) => setComplaintLocation(event.target.value)}
                      placeholder="e.g. Block A, Room 204"
                    />

                    <label htmlFor="complaint-priority">Priority</label>
                    <select
                      id="complaint-priority"
                      value={complaintPriority}
                      onChange={(event) =>
                        setComplaintPriority(
                          event.target.value as Complaint["priority"]
                        )
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>

                    <label htmlFor="complaint-description">Describe the issue</label>
                    <textarea
                      id="complaint-description"
                      rows={4}
                      maxLength={1500}
                      value={complaintDescription}
                      onChange={(event) =>
                        setComplaintDescription(event.target.value)
                      }
                      placeholder="Explain the problem and any relevant details..."
                    />

                    <button
                      className="primary-button"
                      type="button"
                      onClick={addComplaint}
                    >
                      <Flag size={16} /> Submit Complaint
                    </button>
                  </div>

                  <div className="saved-notes-heading">
                    <h2>Complaint History</h2>
                    <span>{complaints.length} complaints</span>
                  </div>

                  {complaints.length === 0 ? (
                    <div className="empty-notes">
                      <ClipboardCheck size={30} />
                      <h3>No complaints submitted yet</h3>
                      <p>
                        Your submitted complaints will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="saved-notes-grid">
                      {complaints.map((complaint) => (
                        <article className="saved-note-card" key={complaint.id}>
                          <h3>{complaint.category}</h3>

                          <p>
                            <strong>Reference ID:</strong> {complaint.id}
                          </p>

                          <p>
                            <strong>Location:</strong> {complaint.location}
                          </p>

                          <p>
                            <strong>Description:</strong> {complaint.description}
                          </p>

                          <p>
                            <strong>Priority:</strong> {complaint.priority}
                          </p>

                          <p>
                            <strong>Status:</strong> {complaint.status}
                          </p>

                          <p>
                            <strong>Submitted:</strong>{" "}
                            {new Date(complaint.createdAt).toLocaleString()}
                          </p>

                          <button
                            className="secondary-button delete-note-button"
                            type="button"
                            onClick={() => deleteComplaint(complaint.id)}
                          >
                            Delete Complaint
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : page === "campus-updates" ? (
                <div className="notes-workspace">
                  <div className="notes-intro">
                    <span className="eyebrow">STAY INFORMED</span>
                    <h2>Campus Updates</h2>
                    <p>
                      Stay up to date with academic announcements, campus events,
                      and important notices.
                    </p>
                  </div>

                  <div className="notes-editor">
                    <h3>Create an Announcement</h3>

                    <label htmlFor="update-title">Title</label>
                    <input
                      id="update-title"
                      value={updateTitle}
                      onChange={(event) => setUpdateTitle(event.target.value)}
                      placeholder="Enter announcement title"
                    />

                    <label htmlFor="update-category">Category</label>
                    <select
                      id="update-category"
                      value={updateCategory}
                      onChange={(event) => setUpdateCategory(event.target.value)}
                    >
                      <option value="Announcements">Announcements</option>
                      <option value="Academics">Academics</option>
                      <option value="Events">Events</option>
                      <option value="Examinations">Examinations</option>
                      <option value="Placements">Placements</option>
                      <option value="General">General</option>
                    </select>

                    <label htmlFor="update-message">Message</label>
                    <textarea
                      id="update-message"
                      rows={4}
                      maxLength={2000}
                      value={updateMessage}
                      onChange={(event) => setUpdateMessage(event.target.value)}
                      placeholder="Write the announcement..."
                    />

                    <label>
                      <input
                        type="checkbox"
                        checked={updateImportant}
                        onChange={(event) => setUpdateImportant(event.target.checked)}
                      />
                      Mark as an important notice
                    </label>

                    <button
                      className="primary-button"
                      type="button"
                      onClick={addCampusUpdate}
                    >
                      <Megaphone size={16} /> Publish Update
                    </button>
                  </div>

                  <div className="notes-editor">
                    <h3>Extra Class Poll</h3>
                    <p>Is an extra PPS class needed?</p>

                    <div className="notes-editor-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => voteClassPoll("yes")}
                      >
                        {classPoll.myVote === "yes" ? "✓ Yes" : "Yes"}
                      </button>

                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => voteClassPoll("no")}
                      >
                        {classPoll.myVote === "no" ? "✓ No" : "No"}
                      </button>
                    </div>

                    <p>
                      <strong>Yes:</strong> {classPoll.yes} &nbsp;&nbsp;
                      <strong>No:</strong> {classPoll.no}
                    </p>
                  </div>

                  <div className="saved-notes-heading">
                    <h2>Latest Updates</h2>
                    <span>{campusUpdates.length} updates</span>
                  </div>

                  {campusUpdates.length === 0 ? (
                    <div className="empty-notes">
                      <Newspaper size={30} />
                      <h3>No campus updates yet</h3>
                      <p>New announcements will appear here.</p>
                    </div>
                  ) : (
                    <div className="saved-notes-grid">
                      {campusUpdates.map((update) => (
                        <article className="saved-note-card" key={update.id}>
                          {update.important && (
                            <span className="eyebrow">IMPORTANT NOTICE</span>
                          )}

                          <h3>{update.title}</h3>

                          <p>
                            <strong>Category:</strong> {update.category}
                          </p>

                          <p>{update.message}</p>

                          <p>
                            <strong>Published:</strong>{" "}
                            {new Date(update.publishedAt).toLocaleString()}
                          </p>

                          <button
                            className="secondary-button delete-note-button"
                            type="button"
                            onClick={() => deleteCampusUpdate(update.id)}
                          >
                            Delete Update
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : page === "admin-complaints" ? (
                <div className="notes-workspace">
                  <div className="saved-notes-heading">
                    <h2>All Complaints</h2>
                    <span>{adminComplaints.length} total</span>
                  </div>
                  {adminComplaints.length === 0 ? (
                    <div className="empty-notes">
                      <ShieldCheck size={30} />
                      <h3>No complaints yet</h3>
                    </div>
                  ) : (
                    <div className="saved-notes-grid">
                      {adminComplaints.map((c) => (
                        <article className="saved-note-card" key={c.referenceId}>
                          <h3>{c.category}</h3>
                          <p><strong>Reference ID:</strong> {c.referenceId}</p>
                          <p><strong>Location:</strong> {c.location}</p>
                          <p><strong>Description:</strong> {c.description}</p>
                          <p><strong>Priority:</strong> {c.priority}</p>
                          <p><strong>Submitted:</strong>{" "}
                            {new Date(c.createdAt).toLocaleString()}</p>
                          <label htmlFor={`status-${c.referenceId}`}>Status</label>
                          <select
                            id={`status-${c.referenceId}`}
                            value={c.status}
                            onChange={(event) =>
                              updateComplaintStatus(
                                c.referenceId,
                                event.target.value as Complaint["status"]
                              )
                            }
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : page === "attendance" ? (
                <div className="notes-workspace">
                  <div className="notes-intro">
                    <span className="eyebrow">YOUR ACADEMIC PROGRESS</span>
                    <h2>Attendance</h2>
                    <p>Track attended classes and monitor attendance by subject.</p>
                  </div>

                  <div className="notes-editor">
                    <label htmlFor="attendance-subject">Subject</label>
                    <input
                      id="attendance-subject"
                      value={attendanceSubject}
                      onChange={(event) => setAttendanceSubject(event.target.value)}
                      placeholder="e.g. Engineering Mathematics"
                    />

                    <label htmlFor="attendance-attended">Classes attended</label>
                    <input
                      id="attendance-attended"
                      type="number"
                      min={0}
                      step={1}
                      value={attendanceAttended}
                      onChange={(event) =>
                        setAttendanceAttended(Number(event.target.value))
                      }
                    />

                    <label htmlFor="attendance-total">Total classes held</label>
                    <input
                      id="attendance-total"
                      type="number"
                      min={1}
                      step={1}
                      value={attendanceTotal}
                      onChange={(event) =>
                        setAttendanceTotal(Number(event.target.value))
                      }
                    />

                    <button
                      className="primary-button"
                      type="button"
                      onClick={addAttendanceRecord}
                    >
                      Save Attendance
                    </button>

                    <p>Entering an existing subject updates its attendance record.</p>
                  </div>

                  <div className="saved-notes-heading">
                    <h2>Subject Attendance</h2>
                    <span>{attendanceRecords.length} subjects</span>
                  </div>

                  {attendanceRecords.length === 0 ? (
                    <div className="empty-notes">
                      <ChartNoAxesColumnIncreasing size={30} />
                      <h3>No attendance records yet</h3>
                      <p>Add your first subject above.</p>
                    </div>
                  ) : (
                    <div className="saved-notes-grid">
                      {attendanceRecords.map((record) => {
                        const percentage = Math.round(
                          (record.attended / record.total) * 100
                        );

                        return (
                          <article className="saved-note-card" key={record.id}>
                            <h3>{record.subject}</h3>

                            <p>
                              <strong>Attendance:</strong>{" "}
                              {record.attended}/{record.total} classes
                            </p>

                            <p>
                              <strong>Percentage:</strong> {percentage}%
                            </p>

                            <div
                              role="progressbar"
                              aria-label={`${record.subject} attendance`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={percentage}
                              style={{
                                height: "8px",
                                borderRadius: "999px",
                                background: "#e5e7eb",
                                overflow: "hidden",
                                margin: "12px 0",
                              }}
                            >
                              <div
                                style={{
                                  width: `${percentage}%`,
                                  height: "100%",
                                  background:
                                    percentage >= 75 ? "#16a34a" : "#dc2626",
                                  transition: "width 0.2s ease",
                                }}
                              />
                            </div>

                            <p>
                              {percentage >= 75
                                ? "At or above 75% attendance"
                                : "Below 75% — attendance needs attention"}
                            </p>

                            <button
                              className="secondary-button delete-note-button"
                              type="button"
                              onClick={() => deleteAttendanceRecord(record.id)}
                            >
                              Delete Record
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : page === "notes" ? (
                <div className="notes-workspace">
                  <div className="notes-intro">
                    <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
                    <h2>My Notes</h2>
                    <p>Capture ideas, organize your subjects, and keep important information handy.</p>
                  </div>

                  <div className="notes-editor">
                    <label htmlFor="note-title">Note title</label>
                    <input
                      id="note-title"
                      type="text"
                      value={noteTitle}
                      onChange={(event) => setNoteTitle(event.target.value)}
                      placeholder="e.g. Data Structures — Arrays"
                    />

                    <label htmlFor="note-content">Your notes</label>
                    <textarea
                      id="note-content"
                      value={noteContent}
                      onChange={(event) => setNoteContent(event.target.value)}
                      placeholder="Write your notes here..."
                      rows={7}
                    />

                    <div className="notes-editor-actions">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={saveNote}
                      >
                        {editingNoteId ? "Update Note" : "Save Note"}
                      </button>

                      {editingNoteId && (
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={cancelNoteEdit}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="saved-notes-heading">
                    <h2>Saved Notes</h2>
                    <span>{notes.length} {notes.length === 1 ? "note" : "notes"}</span>
                  </div>

                  {notes.length === 0 ? (
                    <div className="empty-notes">
                      <NotebookPen size={30} strokeWidth={1.6} />
                      <h3>No notes yet</h3>
                      <p>Create your first note using the editor above.</p>
                    </div>
                  ) : (
                    <div className="saved-notes-grid">
                      {notes.map((note) => (
                        <article className="saved-note-card" key={note.id}>
                          <h3>{note.title}</h3>
                          <p className="saved-note-content">{note.content}</p>
                          <span className="saved-note-date">
                            Updated {note.updatedAt}
                          </span>

                          <div className="saved-note-actions">
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => editNote(note)}
                            >
                              Edit
                            </button>

                            <button
                              className="secondary-button delete-note-button"
                              type="button"
                              onClick={() => deleteNote(note.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="coming-soon-panel">
                  <span className="feature-page-icon">
                    {(() => {
                      const Icon = features.find(
                        (feature) => feature.page === page
                      )?.icon;

                      return Icon ? (
                        <Icon size={24} strokeWidth={1.8} />
                      ) : (
                        <Sparkles size={24} />
                      );
                    })()}
                  </span>

                  <h2>{pageTitles[page]}</h2>

                  <p>
                    This feature will be connected to its complete
                    functionality in the next implementation parts.
                  </p>

                  <button
                    className="primary-button"
                    onClick={goBack}
                    type="button"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </section>
          )}

          <footer className="page-footer">
            <span>© 2026 CampusGen AI</span>
            <span>BUILT FOR A SMARTER CAMPUS EXPERIENCE</span>
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {page === "landing" && (
        <main className="auth-layout">
          <header className="auth-header">
            <button
              className="brand"
              onClick={() => setPage("landing")}
              type="button"
            >
              <span className="brand-mark">C</span>
              <span>
                CampusGen <strong>AI</strong>
              </span>
            </button>
            <span className="header-tagline">
              Your campus. One workspace.
            </span>
          </header>

          <section className="landing-content">
            <div className="landing-copy">
              <span className="eyebrow">THE SMARTER CAMPUS
EXPERIENCE</span>
              <h1>
                Everything campus,
                <br />
                <span>in one place.</span>
              </h1>
              <p>
                A connected workspace for learning, academic planning,
                campus services, and everything in between.
              </p>

              <div className="landing-benefits">
                <span>✓ Academic organization</span>
                <span>✓ Campus services</span>
                <span>✓ Smarter productivity</span>
              </div>

              <button
                className="primary-button landing-button"
                onClick={() => setPage("role")}
                type="button"
              >
                Get started <span>→</span>
              </button>

              <span className="landing-caption">
                A simpler way to experience campus life.
              </span>
            </div>

            <div className="landing-visual">
              <div className="visual-topline">
                <span className="status-dot" />
                YOUR CAMPUS WORKSPACE
              </div>

              <div className="visual-heading">
                <span className="visual-small-label">CAMPUSGEN AI</span>
                <h2>A better way to stay organized.</h2>
                <p>Your academic life, brought together.</p>
              </div>

              <div className="visual-stat-grid">
                <div className="visual-stat">
                  <span className="visual-stat-icon">▤</span>
                  <strong>Academics</strong>
                  <span>Plan your work</span>
                </div>
                <div className="visual-stat">
                  <span className="visual-stat-icon">✦</span>
                  <strong>AI tools</strong>
                  <span>Study smarter</span>
                </div>
                <div className="visual-stat">
                  <span className="visual-stat-icon">♧</span>
                  <strong>Campus</strong>
                  <span>Stay connected</span>
                </div>
                <div className="visual-stat">
                  <span className="visual-stat-icon">◉</span>
                  <strong>Progress</strong>
                  <span>Track your goals</span>
                </div>
              </div>

              <div className="visual-bottom">
                <span>Designed for campus life</span>
                <span>✦</span>
              </div>
            </div>
          </section>

          <footer className="auth-footer">
            <span>© 2026 CampusGen AI</span>
            <span>MADE FOR A SMARTER CAMPUS EXPERIENCE</span>
          </footer>
        </main>
      )}

      {page === "role" && (
        <main className="auth-layout">
          <header className="auth-header">
            <button
              className="brand"
              onClick={() => setPage("landing")}
              type="button"
            >
              <span className="brand-mark">C</span>
              <span>
                CampusGen <strong>AI</strong>
              </span>
            </button>
            <button
              className="text-button"
              onClick={() => setPage("landing")}
              type="button"
            >
              ← Back
            </button>
          </header>

          <section className="selection-content">
            <span className="eyebrow">LET'S GET YOU STARTED</span>
            <h1>Choose your workspace.</h1>
            <p>Select the role that best describes you.</p>

            <div className="role-grid">
              {(
                [
                  {
                    name: "Student" as Role,
                    icon: "♙",
                    description:
                      "Organize studies, track attendance, and access campus services.",
                  },
                  {
                    name: "Faculty" as Role,
                    icon: "▤",
                    description:
                      "Manage attendance, assignments, and campus announcements.",
                  },
                  {
                    name: "Administrator" as Role,
                    icon: "⚙",
                    description:
                      "Oversee campus services, complaints, and user information.",
                  },
                ]
              ).map((item) => (
                <button
                  className={`role-card ${
                    role === item.name ? "selected" : ""
                  }`}
                  key={item.name}
                  onClick={() => setRole(item.name)}
                  type="button"
                >
                  <span className="role-icon">{item.icon}</span>
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <span className="role-select">
                    {role === item.name ? "✓ Selected" : "Select role →"}
                  </span>
                </button>
              ))}
            </div>

            <div className="college-selection">
              <label htmlFor="college">Select Your Institution</label>

              <select
                id="college"
                value={college}
                onChange={(event) => setCollege(event.target.value)}
              >
                <option value="">Select your institution</option>

                <option value="KIET Group of Institutions, Ghaziabad">
                  KIET Group of Institutions, Ghaziabad
                </option>

                <option value="Delhi Institute of Technology">
                  Delhi Institute of Technology
                </option>

                <option value="National College of Technology">
                  National College of Technology
                </option>

                <option value="Other">Other Institution</option>
              </select>

              {college === "Other" && (
                <input
                  type="text"
                  placeholder="Enter your institution name"
                  value=""
                  onChange={(event) => setCollege(event.target.value)}
                />
              )}
            </div>

            <button
              className="primary-button continue-button"
              onClick={() => {
                if (!college) {
                  alert("Please select your institution.");
                  return;
                }

                setPage("login");
              }}
              type="button"
            >
              Continue as {role} <span>→</span>
            </button>
          </section>

          <footer className="auth-footer">
            <span>© 2026 CampusGen AI</span>
            <span>MADE FOR A SMARTER CAMPUS EXPERIENCE</span>
          </footer>
        </main>
      )}

      {page === "login" && (
        <main className="auth-layout">
          <header className="auth-header">
            <button
              className="brand"
              onClick={() => setPage("landing")}
              type="button"
            >
              <span className="brand-mark">C</span>
              <span>
                CampusGen <strong>AI</strong>
              </span>
            </button>

            <button
              className="text-button"
              onClick={() => setPage("role")}
              type="button"
            >
              ← Change role
            </button>
          </header>

          <section className="login-content">
            <div className="login-card">
              <span className="login-icon">C</span>
              <span className="eyebrow">WELCOME TO CAMPUSGEN AI</span>
              <h1>Sign in to continue.</h1>
              <p>
                Access your {role.toLowerCase()} workspace
                {college ? ` at ${college}` : ""}.
              </p>

              <form className="login-form" onSubmit={handleLogin}>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                {loginError && (
                  <p className="form-error" role="alert">
                    {loginError}
                  </p>
                )}

                <button className="primary-button login-button" type="submit">
                  Sign in <span>→</span>
                </button>
              </form>

              <p className="demo-note">
                Prototype mode: any valid email and non-empty password will
                open the selected workspace. This is not secure authentication.
              </p>
            </div>
          </section>

          <footer className="auth-footer">
            <span>© 2026 CampusGen AI</span>
            <span>MADE FOR A SMARTER CAMPUS EXPERIENCE</span>
          </footer>
        </main>
      )}

      {page === "dashboard" ||
      (page !== "landing" && page !== "role" && page !== "login")
        ? renderDashboard()
        : null}
    </div>
  );
}

export default App;