from django import forms
from django.contrib.auth.forms import AuthenticationForm
from .models import User # Corrected import spacing

class LoginForm(AuthenticationForm): # Removed extra space
    username = forms.CharField(
        label='Username',
        widget=forms.TextInput(attrs={ # Corrected attrs dictionary syntax
            'class': 'form-control',
            'placeholder': 'Enter your username'
        }) # Corrected closing brace for attrs
    )
    password = forms.CharField( # Added space after password
        label='Password',
        widget=forms.PasswordInput(attrs={ # Corrected attrs dictionary syntax
            'class': 'form-control',
            'placeholder': 'Enter your password'
        }) # Corrected closing brace for attrs
    )
    class Meta:
        model = User
        fields = ['username', 'password']