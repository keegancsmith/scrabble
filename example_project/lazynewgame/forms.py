from django import forms
from django.contrib.auth.models import User

from lazysignup.models import LazyUser

class LazyUserCreationForm(forms.Form):
    '''Creates a lazy user (no password).

    Same requirements as a normal username, except the max_length is 25
    (instead of 30) and the `-` character is not allowed. This is so that we
    can add the suffix -num to it.'''

    username = forms.RegexField(label="Nickname", initial='anon', max_length=25, regex=r'^[\w.@+]+$',
        help_text = "Required. 25 characters or fewer. Letters, digits and @/./+/_ only.",
        error_messages = {'invalid': "This value may contain only letters, numbers and @/./+/_ characters."})

    def save(self):
        '''Creates the LazyUser and User and returns the username (which will
        be different to self.cleaned_data['username'].'''
        username = self.cleaned_data['username']
        count = User.objects.filter(username__startswith=username+'-').count()
        username = u'%s-%d' % (username, count + 1)
        LazyUser.objects.create_lazy_user(username)
        return username
