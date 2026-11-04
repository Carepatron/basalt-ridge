import type { Address, Client, InsurancePolicy } from '../../model';
import { Avatar, Badge, Card, Empty, Field, Fields, Status, Tabs } from '../components';
import { ageOn } from '../../time';
import { CLIENT_STATUS, clientName, legalName } from '../format';
import { icons } from '../icons';
import { Shell, type View } from '../layout';
import { Agenda, NotesTable, personName } from '../parts';

export const CLIENT_TABS = ['overview', 'insurance', 'appointments', 'notes'] as const;
export type ClientTab = (typeof CLIENT_TABS)[number];

const COVERAGE: Record<string, string> = { primary: 'Primary', secondary: 'Secondary', tertiary: 'Tertiary' };

export function ClientPage({ view, client, tab }: { view: View; client: Client; tab: ClientTab }) {
  const { store, format: f, today } = view;
  const policies = store.policies(client.id);
  const appointments = store.appointments({ clientId: client.id });
  const notes = store.notes({ clientId: client.id });
  const base = `/clients/${client.id}`;
  const facts = [
    client.dateOfBirth ? `${ageOn(client.dateOfBirth, today)} years old` : null,
    client.pronouns,
    `Client since ${f.day(client.createdAt)}`,
  ].filter(Boolean);

  return (
    <Shell view={view} section="clients" title={clientName(client)}>
      <a class="back" href="/clients">
        {icons.back}
        Clients
      </a>
      <header class="page-header identity">
        <Avatar name={clientName(client)} seed={client.id} size="lg" />
        <div>
          <h1>{clientName(client)}</h1>
          <p class="subtitle">{facts.join(' · ')}</p>
        </div>
        <div class="actions">
          <Status map={CLIENT_STATUS} value={client.status} />
          <Badge tone={client.billingType === 'insurance' ? 'blue' : 'gray'}>
            {client.billingType === 'insurance' ? 'Insurance' : 'Self-pay'}
          </Badge>
        </div>
      </header>
      <Tabs
        items={[
          { label: 'Overview', href: base, active: tab === 'overview' },
          { label: 'Insurance', href: `${base}/insurance`, active: tab === 'insurance', count: policies.length },
          { label: 'Appointments', href: `${base}/appointments`, active: tab === 'appointments', count: appointments.length },
          { label: 'Notes', href: `${base}/notes`, active: tab === 'notes', count: notes.length },
        ]}
      />
      {tab === 'overview' && <Overview view={view} client={client} />}
      {tab === 'insurance' && <Insurance view={view} client={client} policies={policies} />}
      {tab === 'appointments' && <Appointments view={view} client={client} />}
      {tab === 'notes' && (
        <section class="card flush">
          <NotesTable view={view} notes={notes} withClient={false} />
        </section>
      )}
    </Shell>
  );
}

function Overview({ view, client }: { view: View; client: Client }) {
  const { format: f } = view;
  return (
    <div class="grid two">
      <div class="stack">
        <Card title="Details">
          <Fields>
            <Field label="Legal name">{legalName(client)}</Field>
            <Field label="Preferred name">{client.preferredName}</Field>
            <Field label="Date of birth">{client.dateOfBirth && f.date(client.dateOfBirth)}</Field>
            <Field label="Sex">{client.sex && client.sex[0].toUpperCase() + client.sex.slice(1)}</Field>
            <Field label="Gender identity">{client.genderIdentity}</Field>
            <Field label="Pronouns">{client.pronouns}</Field>
          </Fields>
        </Card>
        <Card title="Care">
          <Fields>
            <Field label="Primary clinician">{personName(view, client.primaryClinicianId)}</Field>
            <Field label="Billing">{client.billingType === 'insurance' ? 'Insurance' : 'Self-pay'}</Field>
            <Field label="Referral source">{client.referralSource}</Field>
            <Field label="Client since">{f.day(client.createdAt)}</Field>
          </Fields>
        </Card>
      </div>
      <div class="stack">
        <Card title="Contact">
          <Fields>
            <Field label="Phone">{client.phone}</Field>
            <Field label="Email">{client.email}</Field>
            <Field label="Address">{client.address && <AddressLines address={client.address} />}</Field>
          </Fields>
        </Card>
        <Card title="Diagnoses">
          {client.diagnoses.length ? (
            <ul class="codes">
              {client.diagnoses.map((dx) => (
                <li>
                  <code>{dx.code}</code>
                  <span>{dx.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p class="muted">No diagnosis recorded.</p>
          )}
        </Card>
        <Card title="Contacts">
          {client.contacts.length ? (
            <ul class="contacts">
              {client.contacts.map((contact) => (
                <li>
                  <Avatar name={contact.name} seed={contact.name} size="sm" />
                  <div>
                    <strong>{contact.name}</strong> <span class="muted">· {contact.relationship}</span>
                    <small>{[contact.phone, contact.email].filter(Boolean).join(' · ')}</small>
                  </div>
                  <div class="tags">
                    {contact.isGuardian && <Badge tone="violet">Guardian</Badge>}
                    {contact.isEmergencyContact && <Badge tone="red">Emergency</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p class="muted">No contacts recorded.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Insurance({ view, client, policies }: { view: View; client: Client; policies: InsurancePolicy[] }) {
  const { format: f } = view;
  if (policies.length === 0) {
    return (
      <section class="card">
        <Empty>
          No insurance on file.
          {client.billingType === 'self_pay' && ` ${client.preferredName ?? client.firstName} pays for their own sessions.`}
        </Empty>
      </section>
    );
  }
  return (
    <div class="grid two">
      {policies.map((policy) => {
        const holder = policy.subscriber;
        return (
          <Card
            title={policy.payerName}
            action={
              <div class="tags">
                <Badge tone={policy.coverage === 'primary' ? 'blue' : 'gray'}>{COVERAGE[policy.coverage] ?? policy.coverage}</Badge>
                <Badge tone={policy.status === 'active' ? 'green' : 'gray'}>{policy.status === 'active' ? 'Active' : 'Ended'}</Badge>
              </div>
            }
          >
            <Fields>
              <Field label="Member ID">
                <code>{policy.memberId}</code>
              </Field>
              <Field label="Group number">{policy.groupNumber}</Field>
              <Field label="Plan">{policy.planName}</Field>
              <Field label="Payer ID">{policy.electronicPayerId}</Field>
              <Field label="Policy holder">
                {holder &&
                  (holder.relationship === 'self' ? (
                    'Client'
                  ) : (
                    <>
                      {holder.firstName} {holder.lastName} ({holder.relationship === 'child' ? 'parent' : holder.relationship})
                      {holder.dateOfBirth && <small class="block muted">Born {f.date(holder.dateOfBirth)}</small>}
                    </>
                  ))}
              </Field>
              <Field label="Copay">{policy.copay !== null && f.money(policy.copay)}</Field>
              <Field label="Deductible">{policy.deductible !== null && f.money(policy.deductible)}</Field>
              <Field label="Coverage">
                {policy.effectiveFrom && `${f.date(policy.effectiveFrom)} – ${policy.effectiveTo ? f.date(policy.effectiveTo) : 'present'}`}
              </Field>
            </Fields>
          </Card>
        );
      })}
    </div>
  );
}

function Appointments({ view, client }: { view: View; client: Client }) {
  const all = view.store.appointments({ clientId: client.id });
  const upcoming = all.filter((a) => new Date(a.endsAt) > view.now);
  const past = all.filter((a) => new Date(a.endsAt) <= view.now).reverse();
  if (all.length === 0) {
    return (
      <section class="card">
        <Empty>No appointments.</Empty>
      </section>
    );
  }
  return (
    <div class="stack">
      <Card title="Upcoming" flush>
        {upcoming.length ? <Agenda view={view} appointments={upcoming} withDate /> : <Empty>Nothing booked.</Empty>}
      </Card>
      <Card title="Past" flush>
        {past.length ? <Agenda view={view} appointments={past} withDate /> : <Empty>No past appointments.</Empty>}
      </Card>
    </div>
  );
}

export const AddressLines = ({ address }: { address: Address }) => (
  <span class="address">
    {address.line1}
    {address.line2 && <span>{address.line2}</span>}
    <span>
      {address.city}, {address.state} {address.postalCode}
    </span>
  </span>
);
