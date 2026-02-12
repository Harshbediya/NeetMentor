from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Subject, Topic, Question, UserAttempt, UserProgress, MockTestResult, StudyLog, UserNote, StudyTask, UserStorage, QuizAttempt
from .serializers import (
    UserSerializer, RegisterSerializer, SubjectSerializer, 
    TopicSerializer, QuestionSerializer, UserAttemptSerializer,
    MockTestResultSerializer, StudyLogSerializer, UserNoteSerializer,
    UserNoteSerializer, StudyTaskSerializer, QuizAttemptSerializer
)
from rest_framework import viewsets
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.db.models import Sum, Avg, Count
from django.contrib.auth.hashers import make_password
import secrets
from datetime import datetime, timedelta
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
import resend
from django.conf import settings


User = get_user_model()
from .models import PreRegistration

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('username')
        # Check if user is in PreRegistration table
        if not User.objects.filter(username=username).exists():
            if PreRegistration.objects.filter(email=username).exists():
                raise serializers.ValidationError({
                    "non_field_errors": ["Your email is not verified yet. Please check your inbox."]
                })
        return super().validate(attrs)

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class MeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "email": user.email,
            "date_joined": user.date_joined,
            "subscription": user.subscription_tier
        })
    
    def patch(self, request):
        user = request.user
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
            user.save()
        return Response({"status": "updated", "first_name": user.first_name})

class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').lower()
        first_name = request.data.get('first_name', '')
        password = request.data.get('password', '')

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email is already in REAL User table
        if User.objects.filter(email=email).exists():
            return Response({"email": ["A user with this email already exists."]}, status=status.HTTP_400_BAD_REQUEST)

        # Create or Update PreRegistration (Cleanup old attempts)
        PreRegistration.objects.filter(email=email).delete()
        
        # Generate 6-digit OTP
        otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        
        PreRegistration.objects.create(
            email=email,
            first_name=first_name,
            password=make_password(password), 
            otp_code=otp
        )

        self.send_verification_email(email, first_name, otp)
        return Response({"message": "OTP sent to your email."}, status=status.HTTP_201_CREATED)

    def send_verification_email(self, email, first_name, otp):
        # Email with OTP Code
        print("\n" + "="*50)
        print(f"VERIFICATION OTP: {otp}")
        print("="*50 + "\n")

        if settings.RESEND_API_KEY:
            try:
                resend.api_key = settings.RESEND_API_KEY
                params = {
                    "from": settings.DEFAULT_FROM_EMAIL,
                    "to": [email],
                    "subject": "Your Verification Code - NEETMentor",
                    "html": f"<p>Hi {first_name},</p><p>Your 6-digit verification code is: <strong>{otp}</strong></p><p>Please enter this code on the website to complete your registration.</p>",
                }
                resend.Emails.send(params)
            except Exception as e:
                print(f"ERROR: Resend failed to send email: {e}")
                # Don't raise the error, let the user proceed to OTP page 
                # They can still grab the OTP from logs if needed
        else:
            # Fallback for local development if no API key
            send_mail(
                'Your Verification Code - NEETMentor',
                f'Hi {first_name},\n\nYour 6-digit verification code is: {otp}\n\nPlease enter this code on the website to complete your registration.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )

class VerifyOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        otp = request.data.get('otp')
        email = request.data.get('email')
        
        print(f"\n--- OTP Verification Attempt ---")
        print(f"Email: {email}, OTP: {otp}")

        try:
            pending = PreRegistration.objects.get(email=email, otp_code=otp)
            
            # Create user
            user = User.objects.create(
                username=pending.email,
                email=pending.email,
                password=pending.password,
                first_name=pending.first_name,
                is_active=True,
                is_email_verified=True
            )
            
            # Cleanup
            pending.delete()
            
            print(f"SUCCESS: {user.email} verified and created!")
            return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)
            
        except PreRegistration.DoesNotExist:
            print(f"FAILED: Invalid OTP")
            return Response({"error": "Invalid verification code. Please check and try again."}, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create user authenticated via Google
        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'first_name': first_name,
                'is_active': True,
                'is_email_verified': True
            }
        )

        # Generate JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'email': user.email,
                'first_name': user.first_name
            }
        })

class SubjectListView(generics.ListAPIView):
    serializer_class = SubjectSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Subject.objects.filter()

class TopicListView(generics.ListAPIView):
    serializer_class = TopicSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Support both subject_id from URL and subject name from query params
        subject_id = self.kwargs.get('subject_id')
        if subject_id:
            return Topic.objects.filter(subject_id=subject_id)
        
        subject_name = self.request.query_params.get('subject')
        if subject_name:
            return Topic.objects.filter(subject__name__iexact=subject_name)
            
        return Topic.objects.filter()

class TaskHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StudyTaskSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Returns all tasks for user, newest first
        return StudyTask.objects.filter(user=self.request.user).order_by('-created_at')

class QuestionListView(generics.ListAPIView):
    serializer_class = QuestionSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        topic_id = self.kwargs['topic_id']
        return Question.objects.filter(topic_id=topic_id)

class SubmitAnswerView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        question_id = request.data.get('question_id')
        selected_option = request.data.get('selected_option')
        
        question = get_object_or_404(Question, id=question_id)
        is_correct = (selected_option == question.correct_option)
        
        # Save Attempt
        attempt = UserAttempt.objects.create(
            user=request.user,
            question=question,
            selected_option=selected_option,
            is_correct=is_correct
        )
        
        # Update Progress logic
        if is_correct:
            # Check if already solved
            already_solved = UserAttempt.objects.filter(
                user=request.user, 
                question=question, 
                is_correct=True
            ).count() > 1
            
            if not already_solved:
                progress, created = UserProgress.objects.get_or_create(
                    user=request.user,
                    topic=question.topic
                )
                progress.questions_solved += 1
                
                total_topic_questions = Question.objects.filter(topic=question.topic).count()
                progress.percentage = (progress.questions_solved / total_topic_questions) * 100
                progress.save()

        return Response({
            "is_correct": is_correct,
            "correct_option": question.correct_option,
            "explanation": question.explanation
        })

class MockTestResultViewSet(viewsets.ModelViewSet):
    serializer_class = MockTestResultSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return MockTestResult.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class StudyLogViewSet(viewsets.ModelViewSet):
    serializer_class = StudyLogSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return StudyLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserNoteViewSet(viewsets.ModelViewSet):
    serializer_class = UserNoteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return UserNote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class StudyTaskViewSet(viewsets.ModelViewSet):
    serializer_class = StudyTaskSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return StudyTask.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserStorageView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        storage, created = UserStorage.objects.get_or_create(user=request.user)
        return Response(storage.data)

    def post(self, request):
        storage, created = UserStorage.objects.get_or_create(user=request.user)
        storage.data = request.data
        storage.save()
        return Response(storage.data)

    def patch(self, request):
        storage, created = UserStorage.objects.get_or_create(user=request.user)
        if isinstance(request.data, dict):
            # Ensure storage.data is a dict (JSONField default is dict but safekeeping)
            if not isinstance(storage.data, dict):
                storage.data = {}
            storage.data.update(request.data)
            storage.save()
        return Response(storage.data)

class QuizAttemptViewSet(viewsets.ModelViewSet):
    serializer_class = QuizAttemptSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Fix: Filter by current user to prevent data leak
        return QuizAttempt.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Fix: Automatically assign attempt to current user
        serializer.save(user=self.request.user)

class AnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        # 1. Overall Stats
        total_questions = QuizAttempt.objects.filter(user=user).aggregate(Sum('total_questions'))['total_questions__sum'] or 0
        correct_answers = QuizAttempt.objects.filter(user=user).aggregate(Sum('correct_answers'))['correct_answers__sum'] or 0
        
        # Accuracy
        accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        
        # Study Time
        total_minutes = StudyLog.objects.filter(user=user).aggregate(Sum('minutes'))['minutes__sum'] or 0
        study_hours = round(total_minutes / 60, 1)
        
        # Syllabus Progress (from UserStorage)
        storage, _ = UserStorage.objects.get_or_create(user=user)
        syllabus_data = storage.data.get('syllabus', {})
        total_topics = 0
        completed_topics = 0
        for subj_data in syllabus_data.values():
            if isinstance(subj_data, dict):
                for topic_status in subj_data.values():
                    total_topics += 1
                    if topic_status == 'completed':
                        completed_topics += 1
        
        syllabus_percent = (completed_topics / total_topics * 100) if total_topics > 0 else 0

        # 2. Intelligence Score Logic
        # Formula: (Accuracy * 4) + (Questions / 10) + (Hours / 2)
        base_score = 300 # Starting score
        earned_score = (accuracy * 4) + (total_questions / 10) + (study_hours / 2)
        intelligence_score = min(720, base_score + int(earned_score))

        # 3. Daily Activity (Last 7 Days)
        days = []
        for i in range(6, -1, -1):
            date = (datetime.now() - timedelta(days=i)).date()
            daily_mins = StudyLog.objects.filter(user=user, date=date).aggregate(Sum('minutes'))['minutes__sum'] or 0
            days.append({
                "day": date.strftime("%a"),
                "hours": round(daily_mins / 60, 1)
            })

        # 4. Subject Mastery
        subjects = ['Physics', 'Chemistry', 'Biology']
        subject_mastery = []
        for sub in subjects:
            sub_correct = QuizAttempt.objects.filter(user=user, quiz_name__icontains=sub).aggregate(Sum('correct_answers'))['correct_answers__sum'] or 0
            sub_total = QuizAttempt.objects.filter(user=user, quiz_name__icontains=sub).aggregate(Sum('total_questions'))['total_questions__sum'] or 0
            sub_acc = (sub_correct / sub_total * 100) if sub_total > 0 else 0
            
            # Simple completion logic for mastery card
            sub_compl = 0
            if sub in syllabus_data:
                sub_topics = syllabus_data[sub]
                if isinstance(sub_topics, dict):
                    t_count = len(sub_topics)
                    c_count = sum(1 for status in sub_topics.values() if status == 'completed')
                    sub_compl = (c_count / t_count * 100) if t_count > 0 else 0

            subject_mastery.append({
                "subject": sub,
                "completion": round(sub_compl),
                "accuracy": round(sub_acc)
            })

        return Response({
            "overallStats": [
                { "label": 'Questions Solved', "value": str(total_questions), "icon": 'Target', "color": '#4F46E5', "trend": f'+{total_questions} total' },
                { "label": 'Estimated Accuracy', "value": f'{round(accuracy)}%', "icon": 'Award', "color": '#10B981', "trend": 'Stable' },
                { "label": 'Study Time', "value": f'{study_hours}h', "icon": 'Clock', "color": '#F59E0B', "trend": f'{total_minutes} mins' },
                { "label": 'Syllabus Done', "value": f'{round(syllabus_percent)}%', "icon": 'BookOpen', "color": '#EF4444', "trend": f'{completed_topics}/{total_topics}' },
            ],
            "subjectMastery": subject_mastery,
            "dailyActivity": days,
            "intelligenceScore": { 
                "score": intelligence_score, 
                "improvement": "Growing consistently", 
                "gain": round(earned_score)
            },
            "health": {
                "goalCompletion": round(syllabus_percent),
                "pyqCoverage": round(accuracy),
                "notesCount": UserNote.objects.filter(user=user).count(),
                "streak": 0 # Logic for streak can be added later
            }
        })
