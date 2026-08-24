
from pathlib import Path
from datetime import timedelta
import os
from corsheaders.defaults import default_headers
import environ

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()

environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = 'django-insecure-=z4bm2396c4@fp)(ub2l@wd&+^a#jrst=%+x22pyy!+(hv02w!'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'api',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    "storages"
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'server.wsgi.application'

AUTH_USER_MODEL = "api.User"


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases



DB_HOST = env("DB_HOST", default=None)
DB_INSTANCE_CONNECTION_NAME = env("DB_INSTANCE_CONNECTION_NAME", default=None)

if DB_HOST or DB_INSTANCE_CONNECTION_NAME:
    # Cloud Run uses the Unix socket; local development can use DB_HOST for
    # Cloud SQL public IP connections authorized by gcloud.
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME"),
            "USER": env("DB_USER"),
            "PASSWORD": env("DB_PASSWORD"),
            "HOST": DB_HOST or f"/cloudsql/{DB_INSTANCE_CONNECTION_NAME}",
            "PORT": env("DB_PORT", default="5432"),
        }
    }
else:
    # Local / test
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

    


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

# Google Cloud Storage for media uploads
GS_BUCKET_NAME = env("GS_BUCKET_NAME", default=None)
GS_PROJECT_ID = env("GS_PROJECT_ID", default=None)

if GS_BUCKET_NAME:
    DEFAULT_FILE_STORAGE = "storages.backends.gcloud.GoogleCloudStorage"
    GS_DEFAULT_ACL = None
    GS_QUERYSTRING_AUTH = False
    MEDIA_URL = f"https://storage.googleapis.com/{GS_BUCKET_NAME}/"
else:
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"

REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://collune.com",
    "https://www.collune.com",
    "https://collune-frontend-727341248620.asia-south1.run.app",
    "https://collune-admin-727341248620.asia-south1.run.app"
]

CORS_ALLOW_HEADERS = (
    *default_headers,
)

CORS_ALLOW_CREDENTIALS = True

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=2),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=5),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "user_id",
    "USER_ID_CLAIM": "user_id",
}

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=not DEBUG)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=not DEBUG)


EMAIL_BACKEND = os.getenv("EMAIL_BACKEND")
EMAIL_HOST = os.getenv("EMAIL_HOST",'')
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS") == "True"

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")

FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")
MOBILE_APP_URL = env("MOBILE_APP_URL", default="collune://")
META_APP_ID = env("META_APP_ID", default="")
META_APP_SECRET = env("META_APP_SECRET", default="")
INSTAGRAM_CLIENT_ID = env("INSTAGRAM_CLIENT_ID", default=META_APP_ID)
INSTAGRAM_CLIENT_SECRET = env("INSTAGRAM_CLIENT_SECRET", default=META_APP_SECRET)
INSTAGRAM_REDIRECT_URI = env(
    "INSTAGRAM_REDIRECT_URI",
    default="http://localhost:8000/api/v1/auth/instagram/callback/",
)
INSTAGRAM_OAUTH_SCOPES = env(
    "INSTAGRAM_OAUTH_SCOPES",
    default="instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_content_publish",
)
FACEBOOK_APP_ID = env("FACEBOOK_APP_ID", default=META_APP_ID)
FACEBOOK_APP_SECRET = env("FACEBOOK_APP_SECRET", default=META_APP_SECRET)
FACEBOOK_GRAPH_VERSION = env("FACEBOOK_GRAPH_VERSION", default="v20.0")
FACEBOOK_REDIRECT_URI = env(
    "FACEBOOK_REDIRECT_URI",
    default="http://localhost:8000/api/v1/auth/facebook/callback/",
)
FACEBOOK_OAUTH_SCOPES = env(
    "FACEBOOK_OAUTH_SCOPES",
    default="public_profile,email,pages_show_list,pages_read_engagement",
)

GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = env("GOOGLE_CLIENT_SECRET", default="")
YOUTUBE_REDIRECT_URI = env(
    "YOUTUBE_REDIRECT_URI",
    default="http://localhost:8000/api/v1/auth/youtube/callback/",
)
YOUTUBE_OAUTH_SCOPES = env(
    "YOUTUBE_OAUTH_SCOPES",
    default="openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
)

X_CLIENT_ID = env("X_CLIENT_ID", default=env("X_CONSUMER_KEY", default=""))
X_CLIENT_SECRET = env("X_CLIENT_SECRET", default=env("X_SECRET_KEY", default=""))
X_REDIRECT_URI = env(
    "X_REDIRECT_URI",
    default="http://localhost:8000/api/v1/auth/x/callback/",
)
X_OAUTH_SCOPES = env(
    "X_OAUTH_SCOPES",
    default="tweet.read users.read follows.read offline.access",
)
