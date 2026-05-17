from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from users.models import UserRole, Role # Added Role import for clarity

@login_required
def dashboard_view(request):
    # Retrieve all UserRole objects for the current user
    user_roles = UserRole.objects.filter(user_id=request.user) # Corrected assignment operator

    # Initialize a dictionary to aggregate the highest permission level for each module.
    # The keys correspond to the permission fields in the Role model.
    permissions = {
        'perm_iam': 0,
        'perm_aodb': 0,
        'perm_rms': 0,
        'perm_fids': 0,
        'perm_admin': 0,
        # The original snippet had 'customers', 'suppliers', 'materials', 'purchses'.
        # These are not defined in the `Role` model. If they are meant to be
        # other types of permissions, they should be added to the `Role` model
        # or handled through a different mechanism.
        # For now, we'll aggregate the permissions defined in the `Role` model.
    }

    # Iterate through all roles assigned to the user and aggregate permissions
    for user_role in user_roles: # Corrected indentation
        role = user_role.role # Corrected indentation
        for module_perm_field in permissions.keys(): # Corrected indentation
            # Get the permission value for the current module from the role
            current_permission_value = getattr(role, module_perm_field, 0) # Corrected spacing and added default

            # Update the aggregated permission if the current role's permission is higher
            if current_permission_value > permissions[module_perm_field]: # Corrected indentation and spacing
                permissions[module_perm_field] = current_permission_value # Corrected indentation and spacing

    context = { # Corrected dictionary initialization
        'user': request.user,
        'permissions': permissions, # Using the aggregated permissions
        'roles': [ur.role.role_name for ur in user_roles],
    }
    return render(request, 'core/dashboard.html', context) # Corrected indentation