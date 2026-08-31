from django.contrib import admin
from .models import Opportunity

@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'department', 'status', 'applicationDeadline', 'createdAt')
    list_filter = ('status', 'workMode', 'industry')
    search_fields = ('title', 'company__name', 'department')
