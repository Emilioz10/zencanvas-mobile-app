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
      // Home Page
      home: {
        title: 'Your Holistic Knowledge and Life Hub',
        subtitle: 'Connect every aspect of your life into one unified, visual network.',
        getStarted: 'Get Started Free',
        learnMore: 'Learn More',
        coreCapabilities: 'Core Capabilities',
        universalNodeSystem: 'Universal Node System',
        universalNodeDesc: 'Every item is a first-class node. Link anything to anything.',
        visualGraphCanvas: 'Visual Graph Canvas',
        visualGraphDesc: 'See all your nodes as a live, navigable network.',
        smartRelationships: 'Smart Relationships',
        smartRelDesc: 'Bi-directional relationships with visible labels.',
        dailyInbox: 'Daily Inbox',
        dailyInboxDesc: 'Quickly capture thoughts, tasks, and notes.',
        timeBlocking: 'Time Blocking',
        timeBlockDesc: 'Visual daily timeline for complete life integration.',
        aiTaskBreakdown: 'AI Task Breakdown',
        aiTaskDesc: 'AI breaks complex tasks into actionable subtasks.',
        designedForClarity: 'Designed for Clarity',
        clarityDesc: 'Built for cognitive accessibility and focus.',
        readyToConnect: 'Ready to Connect Your Life?',
        startBuilding: 'Start building your unified knowledge graph today.',
        copyright: 'ZenCanvas © 2026 • Holistic knowledge and life management',
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
      // Home Page
      home: {
        title: 'מרכז הידע והחיים ההולסטי שלך',
        subtitle: 'חבר כל היבט של חייך לרשת אחת מאוחדת וויזואלית.',
        getStarted: 'התחל בחינם',
        learnMore: 'למד עוד',
        coreCapabilities: 'יכולות ליבה',
        universalNodeSystem: 'מערכת צומת אוניברסלית',
        universalNodeDesc: 'כל פריט הוא צומת מדרגה ראשונה. חבר כל דבר לכל דבר.',
        visualGraphCanvas: 'קנבס גרף ויזואלי',
        visualGraphDesc: 'ראה את כל הצמתים שלך כרשת חיה וניתנת לניווט.',
        smartRelationships: 'קשרים חכמים',
        smartRelDesc: 'קשרים דו-כיווניים עם תוויות גלויות.',
        dailyInbox: 'תיבת קבלה יומית',
        dailyInboxDesc: 'תפוס במהירות מחשבות, משימות והערות.',
        timeBlocking: 'חסימת זמן',
        timeBlockDesc: 'ציר זמן יומי ויזואלי לשילוב חיים מלא.',
        aiTaskBreakdown: 'פירוק משימה בעזרת AI',
        aiTaskDesc: 'בינה מלאכותית מפרקת משימות מורכבות למשימות משנה.',
        designedForClarity: 'מעוצב לבהירות',
        clarityDesc: 'בנוי לנגישות קוגניטיבית וריכוז.',
        readyToConnect: 'מוכן לחבר את חייך?',
        startBuilding: 'התחל לבנות את גרף הידע המאוחד שלך היום.',
        copyright: 'ZenCanvas © 2026 • ניהול ידע וחיים הולסטי',
      },
    },
  },
};

// Detect browser language preference
const getBrowserLanguage = (): 'he' | 'en' => {
  const stored = localStorage.getItem('language');
  if (stored === 'he' || stored === 'en') return stored;
  
  const browserLang = navigator.language?.toLowerCase() || 'en';
  if (browserLang.startsWith('he')) return 'he';
  return 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getBrowserLanguage(),
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
