from django.urls import path,include
from rest_framework import routers
from . import views
# from django.shortcuts import redirect

# def redirect_root(request):
#     response = redirect('jobs/')
#     return response


urlpatterns= [ 
        path('',views.getAll),
        path('for/<str:item_id>',views.forItem),
        path('at/<str:location_link>',views.atLocLink),
        path('history',views.historyAll),
        path('history/for/<str:item_id>',views.historyFor),
        path('history/for/<str:item_id>/',views.historyFor),
        path('history/at/<str:location_link>',views.historyAt),
        path('history/at/<str:location_link>/',views.historyAt),
        # path('history/for/<str:item_id>/from/<str:fromDate>/to/<str:toDate>',views.historyFor),
        path('duration/for/<str:item_id>',views.durationFor), 
        path('summary/at/<str:location_link>',views.summaryAt),
        path('summary/at/<str:location_link>/',views.summaryAt)


    ]

#/state/                            ?t=timestamp
#/state/for/<item_id>               ?t=timestamp
#/state/at/<location_link>          ?t=timestamp
#/state/history                     ?from=timestamp ?to=timestamp
#/state/history/for/<item_id>       ?from=timestamp ?to=timestamp
#/state/history/at/<loction_link>   ?from=timestamp ?to=timestamp
