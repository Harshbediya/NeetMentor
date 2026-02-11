import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Subject, Topic, Question

def seed_data():
    print("Seeding subjects and topics...")
    subjects_data = {
        "Physics": ["Kinematics", "Thermodynamics", "Optics", "Electrostatics"],
        "Chemistry": ["Atomic Structure", "Chemical Bonding", "Organic Chemistry", "Equilibrium"],
        "Biology": ["Cell Biology", "Genetics", "Human Physiology", "Plant Physiology"]
    }
    
    for sub_name, topics in subjects_data.items():
        subject, created = Subject.objects.get_or_create(name=sub_name)
        if created:
            print(f"Created Subject: {sub_name}")
        
        for topic_name in topics:
            topic, t_created = Topic.objects.get_or_create(subject=subject, name=topic_name)
            if t_created:
                print(f"  Created Topic: {topic_name}")

    # Create a sample question
    topic = Topic.objects.filter(name="Kinematics").first()
    if topic:
        q, created = Question.objects.get_or_create(
            topic=topic,
            content="A car starts from rest and accelerates at 2m/s². What is its velocity after 5 seconds?",
            options=["5 m/s", "10 m/s", "15 m/s", "20 m/s"],
            correct_option=1,
            difficulty="Easy",
            explanation="Using v = u + at: v = 0 + (2 * 5) = 10 m/s."
        )
        if created:
            print(f"Created Sample Question in Kinematics")

    print("Seeding complete!")

if __name__ == "__main__":
    seed_data()
