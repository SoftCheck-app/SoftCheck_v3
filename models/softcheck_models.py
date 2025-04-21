import uuid
from django.db import models
from django.utils import timezone

class Employees(models.Model):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('inactive', 'Inactive')
    ], default='active')
    
    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
    
    def __str__(self):
        return f"{self.name} <{self.email}> - {self.department}"

class LicenseDatabase(models.Model):
    license_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Employees, on_delete=models.CASCADE, related_name='licenses')
    software_name = models.CharField(max_length=255)
    activation_date = models.DateTimeField(default=timezone.now)
    expiration_date = models.DateTimeField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('revoked', 'Revoked'),
        ('pending', 'Pending')
    ], default='active')
    
    class Meta:
        verbose_name = 'License'
        verbose_name_plural = 'Licenses'
    
    def __str__(self):
        return f"{self.software_name} - {self.user.name} - {self.status}"

class SoftwareDatabase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device_id = models.CharField(max_length=255)
    user = models.ForeignKey(Employees, on_delete=models.CASCADE, related_name='software')
    license = models.ForeignKey(LicenseDatabase, on_delete=models.SET_NULL, null=True, blank=True, related_name='installations')
    software_name = models.CharField(max_length=255)
    version = models.CharField(max_length=100)
    vendor = models.CharField(max_length=255)
    install_date = models.DateTimeField(default=timezone.now)
    install_path = models.CharField(max_length=512)
    install_method = models.CharField(max_length=100)
    last_executed = models.DateTimeField(null=True, blank=True)
    is_running = models.BooleanField(default=False)
    digital_signature = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    detected_by = models.CharField(max_length=100)
    sha256 = models.CharField(max_length=64)
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Software'
        verbose_name_plural = 'Software'
        unique_together = ('device_id', 'software_name', 'version')
    
    def __str__(self):
        return f"{self.software_name} v{self.version} - {self.user.name} - {self.device_id}" 