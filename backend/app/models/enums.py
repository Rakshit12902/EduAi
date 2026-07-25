import enum

class DocumentStatus(str, enum.Enum):
    UPLOADING = 'UPLOADING'
    PROCESSING = 'PROCESSING'
    READY = 'READY'
    FAILED = 'FAILED'
    DELETED = 'DELETED'

class JobStatus(str, enum.Enum):
    QUEUED = 'QUEUED'
    RUNNING = 'RUNNING'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'

class MessageRole(str, enum.Enum):
    user = 'user'
    assistant = 'assistant'
    system = 'system'

class AnswerType(str, enum.Enum):
    document = 'document'
    general = 'general'
    hybrid = 'hybrid'

class AppTheme(str, enum.Enum):
    light = 'light'
    dark = 'dark'
    system = 'system'

class AppLanguage(str, enum.Enum):
    en = 'en'
    hi = 'hi'
    es = 'es'
    fr = 'fr'
    de = 'de'
    zh = 'zh'
    ar = 'ar'
    pt = 'pt'
