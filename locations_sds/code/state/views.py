from django.db.models import Q, Count
from django.http import HttpResponse
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework.response import Response
from rest_framework_csv.renderers import CSVRenderer
import datetime
import dateutil.parser
from collections import Counter
from datetime import timedelta
import math




from .models import State, Event, LocationState
from .serializers import StateSerializer, EventSerializer, LocationStateSerializer, SummarySerializer

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def durationFor(request,item_id):
    q = Q(end__isnull=False) & Q(item_id__exact=item_id)
    qs = LocationState.objects.filter(q).order_by('-start')
    serializer = LocationStateSerializer(qs,many=True)
    return Response(serializer.data)


@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def getAll(request):
    at = request.GET.get('t', None)
    q = Q(end__isnull=True) & ~Q(quantity=0)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at) #parse "at" to datetime
        q = ( q | Q(end__gte=at_dt) ) & Q(start__lte=at_dt)
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def forItem(request,item_id):
    at = request.GET.get('t', None)
    q = Q(end__isnull=True)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at) #parse "at" to datetime
        q = ( q | Q(end__gte=at_dt) ) & Q(start__lte=at_dt)
    q = q & Q(item_id__exact=item_id)
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def atLocLink(request,location_link):
    at = request.GET.get('t', None)
    q = Q(end__isnull=True)

    if at:
        print(f"get all at {at}")
        at_dt = dateutil.parser.isoparse(at) #parse "at" to datetime
        q = ( q | Q(end__gte=at_dt) ) & Q(start__lte=at_dt)
    q = q & Q(location_link__exact=location_link)
    qs = State.objects.filter(q).order_by('-start')
    
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def historyAll(request):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"history {t_start}>{t_end}")
    
    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(end__gte=start_dt)|Q(end__isnull=True)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(start__lte=end_dt)
        
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def historyFor(request,item_id):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"history {t_start}>{t_end}")
    
    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(end__gte=start_dt)|Q(end__isnull=True)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(start__lte=end_dt)
        
    q = q & Q(item_id__exact=item_id)
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def historyAt(request,location_link):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"history {t_start}>{t_end}")
    
    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(end__gte=start_dt)|Q(end__isnull=True)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(start__lte=end_dt)
        
    q = q & Q(location_link__exact=location_link)
    qs = State.objects.filter(q).order_by('-start')
    serializer = StateSerializer(qs,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def summaryAt(request,location_link):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"summary {t_start}>{t_end}")
    
    q = Q()
    
    start_dt = None
    end_dt = None
    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(end__gte=start_dt)|Q(end__isnull=True)
        
    
    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(start__lte=end_dt)
    
    print(f"start_dt: {start_dt}")
    print(f"end_dt: {end_dt}")

    # Initial State Summary
    q = q & Q(location_link__exact=location_link)
    qs = State.objects.filter(q).order_by('-start')
    datetime_list = []
    datetime_list.append(start_dt)

    
    for state in qs:
        print (f"state: {state} , {state.state} \n")
        datetime_list.append(state.start) if state.start is not None else None
        datetime_list.append(state.end) if state.end is not None else None

    datetime_list.append(end_dt)
    datetime_list = list(set(datetime_list))

    output_data = []
    current_time = start_dt
    for datetime_obj in datetime_list:
        current_qs = qs.filter(Q(start__lte=datetime_obj) & (Q(end__gte=datetime_obj) | Q(end__isnull=True)))
        # current_qs = qs.filter(start__lte=datetime_obj, end__gte=datetime_obj) 
        if current_qs.exists():
            # print(current_qs)
            states = [item['state'] for item in current_qs.values('state')]
            state_counts = dict(Counter(states))
            state_counts['timestamp'] = datetime_obj.strftime("%Y-%m-%dT%H:%M:%S%z")
            
            if 'Active' not in state_counts:
                state_counts['Active'] = 0
            if 'Pending' not in state_counts:
                state_counts['Pending'] = 0
            if 'Complete' not in state_counts:
                state_counts['Complete'] = 0
            output_data.append(state_counts)
            # print(state_counts)
        # datetime += timedelta(seconds=time_delta)



    # print(output_data)
    # state_summary = qs.annotate(item_count=Count('state'))
    # states = [item['state'] for item in qs.values('state')]
    # state_counts = dict(Counter(states))
    # print(state_counts)






    # state_summary = qs.values('state') #.annotate(item_count=Count('state'))

    serializer = SummarySerializer(output_data,many=True)
    return Response(serializer.data)

@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def getAllEvents(request):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = Q()

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)

 
@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def eventsForItem(request,item_id):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = Q(item_id__exact=item_id)

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)


@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def eventsToLocLink(request,location_link):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = Q(to_location_link__exact=location_link)

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)


@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def eventsFromLocLink(request,location_link):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = Q(from_location_link__exact=location_link)

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)

 
@api_view(('GET',))
@renderer_classes((JSONRenderer,BrowsableAPIRenderer,CSVRenderer))
def eventsAtLocLink(request,location_link):
    t_start = request.GET.get('from', None)
    t_end = request.GET.get('to', None)
    print(f"all events {t_start}>{t_end}")
    
    q = (Q(from_location_link__exact=location_link)|Q(to_location_link__exact=location_link))

    if t_start:
        start_dt = dateutil.parser.isoparse(t_start)
        q = q&Q(timestamp__gte=start_dt)

    if t_end:
        end_dt = dateutil.parser.isoparse(t_end)
        q = q&Q(timestamp__lte=end_dt)
        
    qs = Event.objects.filter(q).order_by('-timestamp')
    serializer = EventSerializer(qs,many=True)
    return Response(serializer.data)

 
