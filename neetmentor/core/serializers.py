from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Subject, Topic, Question, UserAttempt, UserProgress, MockTestResult, StudyLog, UserNote, StudyTask, UserStorage, QuizAttempt

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'date_joined', 'subscription_tier')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'email': {'required': True, 'allow_blank': False}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', '')
        )
        return user

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

class UserAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAttempt
        fields = '__all__'

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = '__all__'

class StudyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyLog
        fields = ('id', 'date', 'minutes', 'subject', 'topic')

class MockTestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = MockTestResult
        fields = '__all__'
        extra_kwargs = {'user': {'read_only': True}}

class UserNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNote
        fields = '__all__'
        extra_kwargs = {'user': {'read_only': True}}

class StudyTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyTask
        fields = '__all__'
        extra_kwargs = {'user': {'read_only': True}}

class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'
        extra_kwargs = {'user': {'read_only': True}}
