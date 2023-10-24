from rest_framework import serializers

from .models import State

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model=State
        fields = ('record_id','item_id','location_link',"start","end","quantity")

    # def to_representation(self, obj):
        # rep = super().to_representation(obj)
        # rep['location'] = rep['location']['name']
        # return rep


