from django.contrib import admin
from . import models
# from adminsortable.admin import SortableAdmin
import datetime
import time

@admin.register(models.State)
class StateAdmin(admin.ModelAdmin):
    list_display = ['record_id','item_id','location_link','start','end','state']
    fields = ('record_id','item_id','location_link','start','end','state')
    readonly_fields = ('record_id',)
    list_filter = ['location_link']
    ordering = ['start']

@admin.register(models.Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['event_id','item_id','from_location_link','to_location_link','timestamp','quantity', 'message']
    fields = ('event_id','item_id','from_location_link','to_location_link','timestamp','quantity', 'message')
    readonly_fields = ('event_id',)
    list_filter = ['item_id','to_location_link']
    ordering = ['timestamp']


# @admin.register(models.LocationState)
# class LocationStateAdmin(admin.ModelAdmin):
#     list_display = ['record_id','item_id','location_link','start','end','quantity', 'time_elapsed', 'inactive_time_elapsed', 'state']
#     fields = ('record_id','item_id','location_link','start','end','time_elapsed','state')
#     readonly_fields = ('record_id',)
#     list_filter = ['location_link']
#     ordering = ['item_id']