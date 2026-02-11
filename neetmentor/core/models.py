from django.db import models
from django.contrib.auth.models import AbstractUser
import datetime

class User(AbstractUser):
    subscription_tier = models.CharField(max_length=50, default='Pro') 
    is_email_verified = models.BooleanField(default=False)

class PreRegistration(models.Model):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    password = models.CharField(max_length=255)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

class UserStorage(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='storage')
    data = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.user.username}'s Storage"

class Subject(models.Model):
    name = models.CharField(max_length=100) # e.g., Physics
    
    def __str__(self):
        return self.name

class Topic(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    name = models.CharField(max_length=200) # e.g., Kinematics
    
    def __str__(self):
        return f"{self.subject.name} - {self.name}"

class Question(models.Model):
    DIFFICULTY_CHOICES = [
        ('Easy', 'Easy'),
        ('Medium', 'Medium'),
        ('Hard', 'Hard'),
    ]
    
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='questions')
    content = models.TextField()
    options = models.JSONField() # List of options
    correct_option = models.IntegerField() # index of correct option
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='Medium')
    explanation = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Q{self.id}: {self.content[:50]}..."

class UserAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.IntegerField()
    is_correct = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    questions_solved = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'topic')

class StudyLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_logs')
    date = models.DateField(default=datetime.date.today)
    minutes = models.IntegerField(default=0)
    subject = models.CharField(max_length=100, blank=True, null=True)
    topic = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.minutes}m"

class MockTestResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mock_tests')
    name = models.CharField(max_length=255)
    date = models.DateField()
    score = models.IntegerField()
    physics = models.IntegerField()
    chemistry = models.IntegerField()
    biology = models.IntegerField()
    incorrect = models.IntegerField()
    attempt_order = models.CharField(max_length=50, blank=True, null=True)
    time_bio = models.IntegerField(default=0)
    time_chem = models.IntegerField(default=0)
    time_phy = models.IntegerField(default=0)
    mistake_breakdown = models.JSONField(default=list) # Store as list of objects
    
    def __str__(self):
        return f"{self.user.username} - {self.name} ({self.score})"

class UserNote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=255)
    content = models.TextField()
    subject = models.CharField(max_length=100, default='General')
    chapter = models.CharField(max_length=255, blank=True, null=True)
    image_url = models.TextField(blank=True, null=True) # Storing as base64 or URL
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"

class StudyTask(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    subject = models.CharField(max_length=100)
    topic = models.CharField(max_length=255)
    time_goal = models.CharField(max_length=100) # e.g. "45 min"
    questions_goal = models.CharField(max_length=100) # e.g. "20 MCQs"
    priority = models.CharField(max_length=20, default='medium')
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.topic}"

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100) # e.g. 'PYQ', 'Full Mock'
    score = models.IntegerField()
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    incorrect_answers = models.IntegerField()
    time_taken = models.IntegerField() # in seconds
    mistake_data = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.quiz_name} ({self.score})"
