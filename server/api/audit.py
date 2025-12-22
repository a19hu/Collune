import inspect
from .models import AuditLog

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')


def audit_log(request, action):
    # get calling file & function
    frame = inspect.stack()[1]
    file_name = frame.filename.split('/')[-1]
    function_name = frame.function

    AuditLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        action=action,
        file_name=file_name,
        function_name=function_name,
        ip_address=get_client_ip(request)
    )
