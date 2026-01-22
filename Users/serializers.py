from rest_framework.serializers import ModelSerializer
from Users.models import User


class UserSerializer(ModelSerializer):
    class Meta:
       model=User
       fields=['id','username', 'email', 'role', 'contact', 'address', 'profile_picture']
       read_only_fields=['role']


class RegsiterUserSerializer(ModelSerializer):
    class Meta:
       model=User
       fields=['username','password','role','email','contact']

    def create(self,validated_data):
        user=User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            role=validated_data['role'],
            email=validated_data['email'],
            contact=validated_data['contact']
        )
        return user
