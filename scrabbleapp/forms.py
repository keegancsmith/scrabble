from scrabbleapp.models import Game

from django import forms
from django.contrib.auth.models import User


class CreateGameForm(forms.Form):
    name = forms.CharField(max_length=50)
    player2 = forms.ModelChoiceField(queryset=User.objects.none(), required=True)
    player3 = forms.ModelChoiceField(queryset=User.objects.none(), required=False)
    player4 = forms.ModelChoiceField(queryset=User.objects.none(), required=False)

    def __init__(self, user, *args, **kw):
        super(CreateGameForm, self).__init__(*args, **kw)
        self.user = user

        # XXX we need a friends model
        friends_qs = User.objects.all()
        for i in range(2, 5):
            self.fields['player%d' % i].queryset = friends_qs

    def create_game(self):
        players = [self.user]
        for i in range(2, 5):
            field = 'player%d' % i
            if self.cleaned_data[field]:
                players.append(self.cleaned_data[field])
        return Game.create_game(players, self.cleaned_data['name'])
