from django.contrib import admin
from .models import Application, Placement

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('student', 'opportunity', 'company', 'status', 'submittedAt')
    list_filter = ('status',)
    search_fields = ('student__fullName', 'opportunity__title', 'company__name')

@admin.register(Placement)
class PlacementAdmin(admin.ModelAdmin):
    list_display = ('student', 'company', 'opportunity', 'status', 'startDate', 'endDate')
    list_filter = ('status',)
    search_fields = ('student__fullName', 'company__name')
