from rest_framework import serializers
from .models import DocumentRecord

class DocumentSerializer(serializers.ModelSerializer):
    previewUrl = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentRecord
        fields = '__all__'
        read_only_fields = ['ownerId', 'ownerRole', 'uploadedAt', 'status', 'reviewedById', 'reviewedAt', 'reviewComment', 'sizeBytes', 'mimeType', 'filename']
        
    def get_previewUrl(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
