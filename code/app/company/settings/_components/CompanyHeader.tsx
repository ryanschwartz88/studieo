'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateCompanySchema, type UpdateCompanyInput } from '@/lib/schemas/companies';
import { updateCompany, uploadCompanyLogo } from '@/lib/actions/companies';
import { toast } from 'sonner';
import { Pencil, Upload, Loader2, ExternalLink, MapPin, Building2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type Company = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  domain: string | null;
  location: string | null;
};

interface CompanyHeaderProps {
  company: Company;
  userCount: number;
}

const getCompanySizeLabel = (count: number): string => {
  if (count === 1) return 'Solo';
  if (count <= 5) return 'Small';
  if (count <= 20) return 'Medium';
  if (count <= 50) return 'Large';
  return 'Enterprise';
};

export function CompanyHeader({ company, userCount }: CompanyHeaderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(company.logo_url);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<UpdateCompanyInput>({
    // @ts-ignore - zod v4 type compatibility issue
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: company.name,
      description: company.description || '',
      domain: company.domain || '',
      location: company.location || '',
    },
  });
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onSubmit = async (data: UpdateCompanyInput) => {
    try {
      setIsUploading(true);
      
      // Upload logo if changed
      if (logoFile) {
        const logoResult = await uploadCompanyLogo(logoFile);
        if (!logoResult.success) {
          toast.error(logoResult.error || 'Failed to upload logo');
          setIsUploading(false);
          return;
        }
        data.logo_url = logoResult.data?.logo_url;
      }
      
      // Update company
      const result = await updateCompany(data);
      if (!result.success) {
        toast.error(result.error || 'Failed to update company');
        setIsUploading(false);
        return;
      }
      
      toast.success('Company updated successfully');
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('An error occurred');
      setIsUploading(false);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-start gap-6">
        <div className="relative">
          {logoPreview && !imageError ? (
            <Image
              src={logoPreview}
              alt={company.name}
              width={96}
              height={96}
              className="w-24 h-24 rounded-lg object-cover border"
              onError={() => setImageError(true)}
            />
          ) : (
            <Avatar className="w-24 h-24 rounded-lg">
              <AvatarFallback className="rounded-lg text-2xl">
                {getInitials(company.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold">{company.name}</h1>
            <Badge variant="outline" className="bg-muted/50">
              {getCompanySizeLabel(userCount)}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {company.domain && (
              <a
                href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Building2 className="h-4 w-4" />
                <span>{company.domain.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {company.location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{company.location}</span>
              </div>
            )}
          </div>
        </div>
        
        <Button variant="outline" onClick={() => setIsOpen(true)} data-testid="edit-company-button">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>
      
      {company.description && (
        <>
        <Separator className="my-4" />
        <div>
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-sm text-muted-foreground">{company.description}</p>
        </div>
        </>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Company Information</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                ) : (
                  <Avatar className="w-20 h-20 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xl">
                      {getInitials(form.watch('name') || company.name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleLogoChange}
                    data-testid="company-logo-upload"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                {...form.register('name')}
                data-testid="company-name-input"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                rows={4}
                placeholder="Tell us about your company..."
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="domain">Domain / Website</Label>
              <Input
                id="domain"
                {...form.register('domain')}
                placeholder="example.com"
                data-testid="company-domain-input"
              />
              {form.formState.errors.domain && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.domain.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...form.register('location')}
                placeholder="San Francisco, CA"
                data-testid="company-location-input"
              />
              {form.formState.errors.location && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

