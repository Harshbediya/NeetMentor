import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.core.mail import send_mail
try:
    send_mail(
        'Test Success!', 
        'Congratulations! Your Gmail integration is working perfectly.', 
        'harshbedi3112@gmail.com', 
        ['harshbedi3112@gmail.com'], 
        fail_silently=False
    )
    print('SUCCESS: Email sent!')
except Exception as e:
    print(f'ERROR: {e}')
