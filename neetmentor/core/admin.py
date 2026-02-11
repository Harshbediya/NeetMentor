from django.contrib import admin
from .models import User, UserStorage, Subject, Topic, Question, UserAttempt, UserProgress, StudyLog, MockTestResult, UserNote, StudyTask, QuizAttempt

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'subscription_tier', 'is_email_verified', 'date_joined')

@admin.register(UserStorage)
class UserStorageAdmin(admin.ModelAdmin):
    list_display = ('user',)
    search_fields = ('user__username',)

@admin.register(StudyTask)
class StudyTaskAdmin(admin.ModelAdmin):
    list_display = ('user', 'topic', 'subject', 'is_done', 'created_at')
    list_filter = ('is_done', 'subject')

@admin.register(StudyLog)
class StudyLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'minutes', 'subject', 'topic')
    list_filter = ('subject', 'date')

@admin.register(UserNote)
class UserNoteAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'subject', 'is_pinned', 'created_at')
    list_filter = ('is_pinned', 'subject')

@admin.register(MockTestResult)
class MockTestResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'score', 'date')

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz_name', 'score', 'created_at')

admin.site.register(Subject)
admin.site.register(Topic)
admin.site.register(Question)
admin.site.register(UserAttempt)
admin.site.register(UserProgress)
