from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, SubjectListView, TopicListView,
    QuestionListView, SubmitAnswerView,
    MockTestResultViewSet, StudyLogViewSet, UserNoteViewSet, StudyTaskViewSet,
    UserStorageView, TaskHistoryViewSet, MeView, UserProfileView, QuizAttemptViewSet,
    VerifyOTPView, AnalyticsView, GoogleLoginView
)

router = DefaultRouter()
router.register(r'mock-tests', MockTestResultViewSet, basename='mock-test')
router.register(r'study-logs', StudyLogViewSet, basename='study-log')
router.register(r'notes', UserNoteViewSet, basename='note')
router.register(r'tasks', StudyTaskViewSet, basename='task')
router.register(r'task-history', TaskHistoryViewSet, basename='task-history')
router.register(r'quiz-attempts', QuizAttemptViewSet, basename='quiz-attempt')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('me/', MeView.as_view(), name='me'),
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),
    path('user-profile/', UserProfileView.as_view(), name='user-profile'),
    path('subjects/', SubjectListView.as_view(), name='subject-list'),
    path('topics/', TopicListView.as_view(), name='topic-search'),
    path('topics/<int:subject_id>/', TopicListView.as_view(), name='topic-list'),
    path('questions/<int:topic_id>/', QuestionListView.as_view(), name='question-list'),
    path('submit-answer/', SubmitAnswerView.as_view(), name='submit-answer'),
    path('user-storage/', UserStorageView.as_view(), name='user-storage'),
    path('analytics-data/', AnalyticsView.as_view(), name='analytics-data'),
    path('', include(router.urls)),
]
