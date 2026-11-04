import { Avatar, Badge, Card, Empty, Field, Fields, PageHeader, Tabs } from '../components';
import { ROLE, memberName } from '../format';
import { icons } from '../icons';
import { Shell, type View } from '../layout';
import { AddressLines } from './client';

export const SETTINGS = {
  practice: 'Practice',
  locations: 'Locations',
  services: 'Services',
  team: 'Team',
  payers: 'Insurance payers',
} as const;
export type SettingsSection = keyof typeof SETTINGS;

export function SettingsPage({ view, section }: { view: View; section: SettingsSection }) {
  return (
    <Shell view={view} section="settings" title={SETTINGS[section]}>
      <PageHeader title="Settings" subtitle="How the practice is set up" />
      <Tabs
        items={Object.entries(SETTINGS).map(([key, label]) => ({
          label,
          href: key === 'practice' ? '/settings' : `/settings/${key}`,
          active: key === section,
        }))}
      />
      {section === 'practice' && <PracticeDetails view={view} />}
      {section === 'locations' && <Locations view={view} />}
      {section === 'services' && <Services view={view} />}
      {section === 'team' && <Team view={view} />}
      {section === 'payers' && <Payers view={view} />}
    </Shell>
  );
}

function PracticeDetails({ view }: { view: View }) {
  const { practice } = view.store;
  return (
    <div class="grid two">
      <Card title="Practice">
        <Fields>
          <Field label="Name">{practice.name}</Field>
          <Field label="Legal name">{practice.legalName}</Field>
          <Field label="Phone">{practice.phone}</Field>
          <Field label="Email">{practice.email}</Field>
          <Field label="Website">{practice.website}</Field>
          <Field label="Address">{practice.address && <AddressLines address={practice.address} />}</Field>
        </Fields>
      </Card>
      <Card title="Billing and identifiers">
        <Fields>
          <Field label="NPI (Type 2)">{practice.npi && <code>{practice.npi}</code>}</Field>
          <Field label="Tax ID (EIN)">{practice.taxId && <code>{practice.taxId}</code>}</Field>
          <Field label="Taxonomy code">{practice.taxonomyCode && <code>{practice.taxonomyCode}</code>}</Field>
          <Field label="Time zone">{practice.timezone}</Field>
          <Field label="Currency">{practice.currency}</Field>
        </Fields>
      </Card>
      <Card title="Start over">
        <form class="start-over" method="post" action="/settings/reset">
          <p class="muted">Delete everything in this practice and go back to how it started. This can't be undone.</p>
          <label class="check">
            <input type="checkbox" name="confirm" required /> Yes, delete everything
          </label>
          <button class="button danger" type="submit">
            Start over
          </button>
        </form>
      </Card>
    </div>
  );
}

const Nothing = ({ children }: { children: string }) => (
  <section class="card">
    <Empty>{children}</Empty>
  </section>
);

function Locations({ view }: { view: View }) {
  if (!view.store.locations.length) return <Nothing>No locations yet.</Nothing>;
  return (
    <div class="grid three">
      {view.store.locations.map((location) => (
        <Card
          title={
            <span class="with-icon">
              {location.kind === 'telehealth' ? icons.video : icons.pin}
              {location.name}
            </span>
          }
          action={
            <Badge tone={location.kind === 'telehealth' ? 'violet' : 'blue'}>
              {location.kind === 'telehealth' ? 'Telehealth' : 'In person'}
            </Badge>
          }
        >
          <Fields>
            {location.address && (
              <Field label="Address">
                <AddressLines address={location.address} />
              </Field>
            )}
            {location.phone && <Field label="Phone">{location.phone}</Field>}
            <Field label="Place of service">
              {location.placeOfService && (
                <>
                  <code>{location.placeOfService.code}</code> {location.placeOfService.description}
                </>
              )}
            </Field>
          </Fields>
        </Card>
      ))}
    </div>
  );
}

function Services({ view }: { view: View }) {
  const { store, format: f } = view;
  if (!store.services.length) return <Nothing>No services yet.</Nothing>;
  return (
    <section class="card flush">
      <table class="table">
        <thead>
          <tr>
            <th>Service</th>
            <th>CPT code</th>
            <th>Modifiers</th>
            <th class="num">Duration</th>
            <th class="num">Fee</th>
          </tr>
        </thead>
        <tbody>
          {store.services.map((service) => (
            <tr>
              <td>
                <strong>{service.name}</strong>
              </td>
              <td>{service.cptCode ? <code>{service.cptCode}</code> : <span class="muted">Not billable</span>}</td>
              <td>{service.modifiers.length ? service.modifiers.map((m) => <code>{m}</code>) : <span class="muted">None</span>}</td>
              <td class="num">{service.durationMinutes} min</td>
              <td class="num">{f.money(service.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Team({ view }: { view: View }) {
  const { store, format: f } = view;
  return (
    <section class="card flush">
      <table class="table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th>NPI</th>
            <th>License</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {store.team.map((member) => (
            <tr>
              <td>
                <span class="person">
                  <Avatar name={`${member.firstName} ${member.lastName}`} seed={member.id} />
                  <span>
                    <strong>{memberName(member)}</strong>
                    <small>{member.email}</small>
                  </span>
                </span>
              </td>
              <td>
                {ROLE[member.role]}
                <small class="block muted">{member.title}</small>
              </td>
              <td>{member.npi ? <code>{member.npi}</code> : <span class="muted">None</span>}</td>
              <td>
                {member.license ? (
                  <>
                    {member.license.number} <span class="muted">· {member.license.state}</span>
                    {member.license.expiresOn && <small class="block muted">Expires {f.date(member.license.expiresOn)}</small>}
                  </>
                ) : (
                  <span class="muted">None</span>
                )}
              </td>
              <td>
                <Badge tone={member.status === 'active' ? 'green' : 'gray'}>{member.status === 'active' ? 'Active' : 'Deactivated'}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Payers({ view }: { view: View }) {
  if (!view.store.payers.length) return <Nothing>No insurance payers yet.</Nothing>;
  const TYPE = { commercial: 'Commercial', medicare: 'Medicare', medicaid: 'Medicaid', other: 'Other' };
  return (
    <section class="card flush">
      <table class="table">
        <thead>
          <tr>
            <th>Payer</th>
            <th>Payer ID</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {view.store.payers.map((payer) => (
            <tr>
              <td>
                <strong>{payer.name}</strong>
              </td>
              <td>{payer.electronicPayerId ? <code>{payer.electronicPayerId}</code> : <span class="muted">Not set</span>}</td>
              <td>{TYPE[payer.type]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
