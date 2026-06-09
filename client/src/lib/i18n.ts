import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'Dashboard',
        canvas: 'Canvas',
        inbox: 'Inbox',
        tasks: 'Tasks',
        timeline: 'Timeline',
        domains: 'Life Domains',
        settings: 'Settings',
      },
      // Common
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        add: 'Add',
        close: 'Close',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
      },
      // Node Editor
      nodeEditor: {
        title: 'Node Editor',
        selectColor: 'Select Color',
        projectLink: 'Project Link',
        addDate: 'Add Date',
        convertToTask: 'Convert to Task',
        convertToNote: 'Convert to Note',
        addConnection: 'Add Connection',
        addDependency: 'Add Dependency',
        selectType: 'Select Type',
        tags: 'Tags',
        status: 'Status',
        priority: 'Priority',
        effort: 'Effort',
        limitations: 'Limitations',
        supportNeeded: 'Support Needed',
      },
      // Tasks
      tasks: {
        inbox: 'Inbox',
        nextActions: 'Next Actions',
        projects: 'Projects',
        someday: 'Someday/Maybe',
        done: 'Done',
        addTask: 'Add Task',
        markDone: 'Mark Done',
        markTodo: 'Mark Todo',
      },
      // Timeline
      timeline: {
        today: 'Today',
        addTimeBlock: 'Add Time Block',
        startTime: 'Start Time',
        endTime: 'End Time',
        duration: 'Duration',
      },
      // Inbox
      inbox: {
        quickCapture: 'Quick Capture',
        captureNote: 'Capture Note',
        placeholder: 'What\'s on your mind?',
      },
      // Life Domains
      domains: {
        health: 'Health',
        relationships: 'Relationships',
        finance: 'Finance',
        work: 'Work',
        personalGrowth: 'Personal Growth',
        leisure: 'Leisure',
        spirituality: 'Spirituality',
        education: 'Education',
      },
      // Auth
      auth: {
        signIn: 'Sign In',
        signOut: 'Sign Out',
        signUp: 'Sign Up',
        welcome: 'Welcome',
        logout: 'Logout',
      },
      // Settings
      settings: {
        language: 'Language',
        theme: 'Theme',
        notifications: 'Notifications',
        privacy: 'Privacy',
        dataBackup: 'Data Backup',
        export: 'Export',
        import: 'Import',
      },
    },
  },
  he: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'דשבורד',
        canvas: 'קנבס',
        inbox: 'תיבת קבלה',
        tasks: 'משימות',
        timeline: 'ציר זמן',
        domains: 'תחומי חיים',
        settings: 'הגדרות',
      },
      // Common
      common: {
        save: 'שמור',
        cancel: 'ביטול',
        delete: 'מחק',
        edit: 'ערוך',
        create: 'צור',
        add: 'הוסף',
        close: 'סגור',
        loading: 'טוען...',
        error: 'שגיאה',
        success: 'הצליח',
        search: 'חפש',
        filter: 'סנן',
        sort: 'מיין',
      },
      // Node Editor
      nodeEditor: {
        title: 'עורך צומת',
        selectColor: 'בחר צבע',
        projectLink: 'קישור לפרויקט',
        addDate: 'הוסף תאריך',
        convertToTask: 'המר למשימה',
        convertToNote: 'המר לפתק',
        addConnection: 'הוסף חיבור',
        addDependency: 'הוסף תלות',
        selectType: 'בחר סוג',
        tags: 'תגיות',
        status: 'סטטוס',
        priority: 'עדיפות',
        effort: 'מאמץ',
        limitations: 'מגבלות',
        supportNeeded: 'תמיכה נדרשת',
      },
      // Tasks
      tasks: {
        inbox: 'תיבת קבלה',
        nextActions: 'פעולות הבאות',
        projects: 'פרויקטים',
        someday: 'כשיום מה',
        done: 'בוצע',
        addTask: 'הוסף משימה',
        markDone: 'סמן כבוצע',
        markTodo: 'סמן כלא בוצע',
      },
      // Timeline
      timeline: {
        today: 'היום',
        addTimeBlock: 'הוסף בלוק זמן',
        startTime: 'זמן התחלה',
        endTime: 'זמן סיום',
        duration: 'משך זמן',
      },
      // Inbox
      inbox: {
        quickCapture: 'תפיסה מהירה',
        captureNote: 'תפוס הערה',
        placeholder: 'מה על דעתך?',
      },
      // Life Domains
      domains: {
        health: 'בריאות',
        relationships: 'קשרים',
        finance: 'כלכלה',
        work: 'עבודה',
        personalGrowth: 'גדילה אישית',
        leisure: 'בילוי',
        spirituality: 'רוחניות',
        education: 'חינוך',
      },
      // Auth
      auth: {
        signIn: 'התחבר',
        signOut: 'התחברות',
        signUp: 'הירשם',
        welcome: 'ברוכים הבאים',
        logout: 'התנתק',
      },
      // Settings
      settings: {
        language: 'שפה',
        theme: 'ערכת נושא',
        notifications: 'הודעות',
        privacy: 'פרטיות',
        dataBackup: 'גיבוי נתונים',
        export: 'ייצוא',
        import: 'ייבוא',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('language') || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

// Helper function to detect language from text
export function detectLanguage(text: string): 'he' | 'en' {
  if (!text) return 'en';
  const hebrewRegex = /[\u0590-\u05FF]/g;
  const englishRegex = /[a-zA-Z]/g;
  const hebrewMatches = (text.match(hebrewRegex) || []).length;
  const englishMatches = (text.match(englishRegex) || []).length;
  return hebrewMatches > englishMatches ? 'he' : 'en';
}

// Helper function to get direction from language
export function getDirection(language: 'he' | 'en'): 'rtl' | 'ltr' {
  return language === 'he' ? 'rtl' : 'ltr';
}

// Helper function to detect direction from text
export function detectDirection(text: string): 'rtl' | 'ltr' {
  const lang = detectLanguage(text);
  return getDirection(lang);
}
