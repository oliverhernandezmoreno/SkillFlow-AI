'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver, type UseFormRegister } from 'react-hook-form';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { accreditationFormSchema, certificationFormSchema, type AccreditationFormValues, type CertificationFormValues, type OtecAccreditation, type QualityCertification } from './schemas';

type Props = { kind: 'accreditation' | 'certification'; record?: OtecAccreditation | QualityCertification; pending: boolean; error: string | null; onCancel: () => void; onSubmit: (value: AccreditationFormValues | CertificationFormValues) => Promise<void> };
const emptyAccreditation: AccreditationFormValues = { accreditationType: '', accreditationNumber: '', issuedAt: '', validFrom: '', validUntil: '', issuingAuthority: '', source: '', externalReference: '', notes: '' };
const emptyCertification: CertificationFormValues = { certificationType: 'NCH_2728', certificationNumber: '', certifyingEntity: '', scope: '', issuedAt: '', validFrom: '', validUntil: '', documentId: '', notes: '' };
const dateOnly = (value: string | null) => value?.slice(0, 10) ?? '';
export function RegulatoryForm({ kind, record, pending, error, onCancel, onSubmit }: Readonly<Props>) {
  const accreditation = kind === 'accreditation';
  const defaults = accreditation ? accreditationValues(record as OtecAccreditation | undefined) : certificationValues(record as QualityCertification | undefined);
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<CombinedValues>({ resolver: zodResolver(accreditation ? accreditationFormSchema : certificationFormSchema) as Resolver<CombinedValues>, defaultValues: defaults });
  return <Card className="p-4 sm:p-6"><h2 className="text-lg font-semibold">{record ? 'Editar' : 'Crear'} {accreditation ? 'acreditación' : 'certificación de calidad'}</h2><form className="mt-5 grid gap-4 sm:grid-cols-2" noValidate onSubmit={(event) => void handleSubmit((value) => onSubmit(value as AccreditationFormValues | CertificationFormValues))(event)}>
    {accreditation ? <>
      <Field label="Tipo de acreditación" name="accreditationType" register={register} error={errors.accreditationType?.message} />
      <Field label="Número de acreditación" name="accreditationNumber" register={register} error={errors.accreditationNumber?.message} />
      <Field label="Organismo emisor" name="issuingAuthority" register={register} /><Field label="Fuente" name="source" register={register} /><Field label="Referencia externa" name="externalReference" register={register} />
    </> : <>
      <FormField label="Tipo de certificación" htmlFor="certificationType" error={errors.certificationType?.message as string | undefined}><select id="certificationType" className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...register('certificationType')}><option value="NCH_2728">NCh 2728</option><option value="ISO_9001">ISO 9001</option><option value="OTHER">Otra</option></select></FormField>
      <Field label="Número de certificación" name="certificationNumber" register={register} error={errors.certificationNumber?.message} /><Field label="Entidad certificadora" name="certifyingEntity" register={register} error={errors.certifyingEntity?.message} /><Field label="Alcance" name="scope" register={register} /><Field label="Documento asociado" name="documentId" register={register} error={errors.documentId?.message} />
    </>}
    <Field label="Fecha de emisión" name="issuedAt" type="date" register={register} /><Field label="Válida desde" name="validFrom" type="date" register={register} /><Field label="Válida hasta" name="validUntil" type="date" register={register} error={errors.validUntil?.message} />
    <div className="sm:col-span-2"><FormField label="Notas" htmlFor="notes" error={errors.notes?.message as string | undefined}><textarea id="notes" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" {...register('notes')} /></FormField></div>
    {error ? <p role="alert" className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}
    <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={pending || (Boolean(record) && !isDirty)}>{pending ? 'Guardando…' : 'Guardar'}</Button></div>
  </form></Card>;
}
type CombinedValues = AccreditationFormValues & CertificationFormValues;
function Field({ label, name, type, register, error }: { label: string; name: keyof CombinedValues; type?: string; register: UseFormRegister<CombinedValues>; error?: unknown }) { return <FormField label={label} htmlFor={name} error={typeof error === 'string' ? error : undefined}><Input id={name} type={type} {...register(name)} /></FormField>; }
function accreditationValues(record?: OtecAccreditation): AccreditationFormValues { return record ? { accreditationType: record.accreditationType, accreditationNumber: record.accreditationNumber, issuedAt: dateOnly(record.issuedAt), validFrom: dateOnly(record.validFrom), validUntil: dateOnly(record.validUntil), issuingAuthority: record.issuingAuthority ?? '', source: record.source ?? '', externalReference: record.externalReference ?? '', notes: record.notes ?? '' } : emptyAccreditation; }
function certificationValues(record?: QualityCertification): CertificationFormValues { return record ? { certificationType: record.certificationType, certificationNumber: record.certificationNumber, certifyingEntity: record.certifyingEntity, scope: record.scope ?? '', issuedAt: dateOnly(record.issuedAt), validFrom: dateOnly(record.validFrom), validUntil: dateOnly(record.validUntil), documentId: record.documentId ?? '', notes: record.notes ?? '' } : emptyCertification; }
