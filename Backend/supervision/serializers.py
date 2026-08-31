from rest_framework import serializers
from .models import SupervisionReport, ProgressReport, Evaluation

class SupervisionReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupervisionReport
        fields = '__all__'

class ProgressReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressReport
        fields = '__all__'

class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = '__all__'
