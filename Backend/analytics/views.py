from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from users.models import StudentProfile, CompanyProfile, User
from opportunities.models import Opportunity
from applications.models import Application, Placement
from documents.models import DocumentRecord
from supervision.models import SupervisionReport
import calendar

class CoordinatorAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # We assume the user is a Coordinator if they can access this (or we could add a specific permission)
        
        students = StudentProfile.objects.all()
        companies = CompanyProfile.objects.all()
        opportunities = Opportunity.objects.all()
        applications = Application.objects.all()
        placements = Placement.objects.all()

        # Totals
        students_count = students.count()
        companies_count = companies.count()
        verified_companies = companies.filter(verificationStatus='VERIFIED').count()
        pending_verification = companies.filter(verificationStatus='PENDING_VERIFICATION').count()
        active_opportunities = opportunities.filter(status=Opportunity.Status.PUBLISHED).count()
        applications_count = applications.count()
        pending_applications = applications.filter(status__in=[
            Application.Status.SUBMITTED,
            Application.Status.COMPANY_REVIEW,
            # We don't have COMPANY_ACCEPTED in Django model yet? Wait, let's check Application.Status
            # Let's map it safely based on the model: SUBMITTED, COMPANY_REVIEW, UNIVERSITY_REVIEW
            'SUBMITTED', 'COMPANY_REVIEW', 'UNIVERSITY_REVIEW'
        ]).count()
        
        approved_placements = placements.filter(status__in=['APPROVED', 'UPCOMING']).count()
        active_placements = placements.filter(status='ACTIVE').count()
        completed_placements = placements.filter(status='COMPLETED').count()
        
        # Concluded for completion rate
        concluded = placements.filter(status__in=['COMPLETED', 'TERMINATED']).count()
        completion_rate = round((completed_placements / concluded * 100)) if concluded > 0 else 0

        # Queues
        opportunity_approval = opportunities.filter(status=Opportunity.Status.PENDING_APPROVAL).count()
        university_review = applications.filter(status='UNIVERSITY_REVIEW').count()
        unassigned_supervisor = placements.filter(
            Q(academicSupervisorId__isnull=True) | Q(academicSupervisorId=''),
            status__in=['APPROVED', 'ACTIVE']
        ).count()

        document_review = DocumentRecord.objects.filter(status=DocumentRecord.Status.PENDING).count()
        overdue_supervision = 0 # Not fully implemented yet
        
        # Grouping for applicationsByMonth
        apps_by_month = applications.annotate(month=TruncMonth('submittedAt')).values('month').annotate(count=Count('id')).order_by('month')
        applications_by_month = []
        for a in apps_by_month:
            if a['month']:
                month_name = calendar.month_abbr[a['month'].month]
                year_str = str(a['month'].year)[-2:]
                applications_by_month.append({
                    "name": f"{month_name} {year_str}",
                    "value": a['count']
                })
        
        # Placements by Programme
        placements_by_prog = placements.values('student__programme').annotate(count=Count('id')).order_by('-count')
        placements_by_programme = [{"name": p['student__programme'], "value": p['count']} for p in placements_by_prog if p['student__programme']]

        # Placement Status
        placement_statuses = placements.values('status').annotate(count=Count('id'))
        placement_status_list = [{"name": p['status'], "value": p['count']} for p in placement_statuses]

        # Opportunities by Industry
        opps_by_ind = opportunities.filter(status='PUBLISHED').values('industry').annotate(count=Count('id')).order_by('-count')
        opportunities_by_industry = [{"name": o['industry'], "value": o['count']} for o in opps_by_ind if o['industry']]

        # Company Participation
        company_part = companies.annotate(
            opps_count=Count('opportunities', distinct=True),
            placements_count=Count('placements', distinct=True)
        ).filter(opps_count__gt=0).order_by('-placements_count', '-opps_count')
        
        company_participation = [{
            "name": c.name,
            "opportunities": c.opps_count,
            "placements": c.placements_count
        } for c in company_part]

        data = {
            "totals": {
                "students": students_count,
                "companies": companies_count,
                "verifiedCompanies": verified_companies,
                "pendingVerification": pending_verification,
                "activeOpportunities": active_opportunities,
                "applications": applications_count,
                "pendingApplications": pending_applications,
                "approvedPlacements": approved_placements,
                "activePlacements": active_placements,
                "completedPlacements": completed_placements,
                "overdueSupervision": overdue_supervision,
            },
            "queues": {
                "companyVerification": pending_verification,
                "opportunityApproval": opportunity_approval,
                "universityReview": university_review,
                "unassignedSupervisor": unassigned_supervisor,
                "documentReview": document_review,
            },
            "completionRate": completion_rate,
            "applicationsByMonth": applications_by_month,
            "placementsByProgramme": placements_by_programme,
            "placementStatus": placement_status_list,
            "opportunitiesByIndustry": opportunities_by_industry,
            "companyParticipation": company_participation,
        }

        return Response(data)


class StudentAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != User.Role.STUDENT:
            return Response({'detail': 'Forbidden'}, status=403)
            
        student_id = f"std-{user.student_profile.id}"
        
        my_apps = Application.objects.filter(studentId=student_id)
        docs = DocumentRecord.objects.filter(ownerId=student_id)
        
        by_status = my_apps.values('status').annotate(count=Count('id'))
        application_status = [{"name": s['status'], "value": s['count']} for s in by_status]
        
        total_apps = my_apps.count()
        pending_apps = my_apps.filter(status__in=[
            Application.Status.SUBMITTED, 
            Application.Status.COMPANY_REVIEW, 
            Application.Status.COMPANY_ACCEPTED, 
            Application.Status.UNIVERSITY_REVIEW
        ]).count()
        
        accepted_apps = my_apps.filter(status__in=[
            Application.Status.COMPANY_ACCEPTED, 
            Application.Status.UNIVERSITY_REVIEW, 
            Application.Status.UNIVERSITY_APPROVED
        ]).count()
        
        docs_pending = docs.filter(status=DocumentRecord.Status.PENDING).count()
        docs_rejected = docs.filter(status=DocumentRecord.Status.REJECTED).count()

        return Response({
            "applicationStatus": application_status,
            "totalApplications": total_apps,
            "pendingApplications": pending_apps,
            "acceptedApplications": accepted_apps,
            "documentsPending": docs_pending,
            "documentsRejected": docs_rejected,
        })

class CompanyAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != User.Role.COMPANY:
            return Response({'detail': 'Forbidden'}, status=403)
            
        company_id = f"co-{user.company_profile.id}"
        
        opps = Opportunity.objects.filter(companyId=company_id)
        apps = Application.objects.filter(companyId=company_id)
        placements = Placement.objects.filter(companyId=company_id)
        
        active_opps = opps.filter(status=Opportunity.Status.PUBLISHED).count()
        total_applicants = apps.count()
        
        pending_reviews = apps.filter(status__in=[
            Application.Status.SUBMITTED, 
            Application.Status.COMPANY_REVIEW
        ]).count()
        
        accepted_students = apps.filter(status__in=[
            Application.Status.UNIVERSITY_REVIEW, 
            Application.Status.UNIVERSITY_APPROVED
        ]).count()
        
        active_interns = placements.filter(status='ACTIVE').count()
        completed_internships = placements.filter(status='COMPLETED').count()
        
        apps_per_opp = []
        for o in opps.exclude(status=Opportunity.Status.DRAFT):
            short_title = o.title.split(' Attachment')[0] if ' Attachment' in o.title else o.title
            val = apps.filter(opportunityId=o.id).count()
            apps_per_opp.append({"name": short_title, "value": val})
            
        decision_split = [
            {
                "name": "Accepted",
                "value": apps.filter(status__in=[Application.Status.UNIVERSITY_REVIEW, Application.Status.UNIVERSITY_APPROVED]).count()
            },
            {
                "name": "Declined",
                "value": apps.filter(status=Application.Status.COMPANY_REJECTED).count()
            },
            {
                "name": "Awaiting review",
                "value": pending_reviews
            }
        ]

        return Response({
            "activeOpportunities": active_opps,
            "totalApplicants": total_applicants,
            "pendingReviews": pending_reviews,
            "acceptedStudents": accepted_students,
            "activeInterns": active_interns,
            "completedInternships": completed_internships,
            "applicationsPerOpportunity": apps_per_opp,
            "decisionSplit": decision_split,
        })

class SupervisorAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'supervisor_profile'):
            return Response({
                "assignedStudents": 0, "activePlacements": 0, "upcomingPlacements": 0, "completedPlacements": 0,
                "requiringSupervision": 0, "overdueSupervision": 0, "pendingEvaluations": 0, "progressReportsAwaitingFeedback": 0
            })
            
        sup_id = str(user.supervisor_profile.id)
        
        mine = Placement.objects.filter(academicSupervisorId=sup_id)
        active = mine.filter(status='ACTIVE')
        
        assigned_students = mine.exclude(status='CANCELLED').count()
        active_placements = active.count()
        upcoming_placements = mine.filter(status='UPCOMING').count()
        completed_placements = mine.filter(status='COMPLETED').count()
        
        from supervision.models import SupervisionReport, ProgressReport, Evaluation
        from django.utils import timezone
        import datetime
        
        three_weeks_ago = timezone.now() - datetime.timedelta(days=21)
        
        requiring_supervision = 0
        overdue_supervision = 0
        
        for p in active:
            last_rep = SupervisionReport.objects.filter(placementId=p.id).order_by('-date').first()
            if not last_rep:
                requiring_supervision += 1
            elif isinstance(last_rep.date, datetime.date) and last_rep.date < three_weeks_ago.date():
                overdue_supervision += 1
                requiring_supervision += 1
        
        pending_evals = 0
        for p in active:
            has_locked_eval = Evaluation.objects.filter(placementId=p.id, locked=True).exists()
            if not has_locked_eval:
                pending_evals += 1
                
        pr_awaiting = ProgressReport.objects.filter(
            placementId__in=mine.values_list('id', flat=True),
            supervisorFeedback__isnull=True
        ).count()
        
        return Response({
            "assignedStudents": assigned_students,
            "activePlacements": active_placements,
            "upcomingPlacements": upcoming_placements,
            "completedPlacements": completed_placements,
            "requiringSupervision": requiring_supervision,
            "overdueSupervision": overdue_supervision,
            "pendingEvaluations": pending_evals,
            "progressReportsAwaitingFeedback": pr_awaiting,
        })
