import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Doctor Discovery (e2e)', () => {
  
  let app: INestApplication;
  let dataSource: DataSource;
  let doctor1Id: number;
  let doctor2Id: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    // Clear data to ensure predictable, clean test runs
    await dataSource.query('TRUNCATE TABLE "doctor" CASCADE');
    await dataSource.query('TRUNCATE TABLE "patient" CASCADE');
    await dataSource.query('TRUNCATE TABLE "user" CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. GET /doctor - Empty database state', async () => {
    const res = await request(app.getHttpServer()).get('/doctor');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.message).toBe('No doctors found in the database.');
  });

  it('2. Seed doctors and verify search/filter functionality', async () => {
    // Signup Doctor 1 (Pramod)
    const signup1 = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'pramod@test.com', password: 'Password123!', role: 'DOCTOR' });
    expect(signup1.status).toBe(201);
    const login1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'pramod@test.com', password: 'Password123!' });
    const token1 = login1.body.access_token;

    // Create profile for Doctor 1 (Pramod)
    const profile1 = await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        fullName: 'Dr. Pramod Munnoli',
        specialization: 'Cardiology',
        experience: 12,
        qualification: 'MD, DM',
        consultationFee: 500,
        availabilityHours: '10am-4pm',
        profileDetails: 'Senior Cardiologist specialist',
      });
    expect(profile1.status).toBe(201);
    doctor1Id = profile1.body.id;

    // Signup Doctor 2 (Alice)
    const signup2 = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'alice@test.com', password: 'Password123!', role: 'DOCTOR' });
    expect(signup2.status).toBe(201);
    const login2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'Password123!' });
    const token2 = login2.body.access_token;

    // Create profile for Doctor 2 (Alice - with empty availabilityHours to test availability filter)
    const profile2 = await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        fullName: 'Dr. Alice Smith',
        specialization: 'Dermatology',
        experience: 5,
        qualification: 'MBBS',
        consultationFee: 300,
        availabilityHours: '',
        profileDetails: 'Dermatologist expert',
      });
    expect(profile2.status).toBe(201);
    doctor2Id = profile2.body.id;

    // A. GET /doctor (all doctors)
    const getAll = await request(app.getHttpServer()).get('/doctor');
    expect(getAll.status).toBe(200);
    expect(getAll.body.data.length).toBe(2);
    expect(getAll.body.total).toBe(2);

    // B. GET /doctor?specialization=Cardiology
    const getCardio = await request(app.getHttpServer()).get('/doctor?specialization=Cardiology');
    expect(getCardio.status).toBe(200);
    expect(getCardio.body.data.length).toBe(1);
    expect(getCardio.body.data[0].id).toBe(doctor1Id);

    // C. GET /doctor?specialization=NonExistent (Invalid/no doctors specialization)
    const getNonExistentSpec = await request(app.getHttpServer()).get('/doctor?specialization=NonExistent');
    expect(getNonExistentSpec.status).toBe(200);
    expect(getNonExistentSpec.body.data).toEqual([]);
    expect(getNonExistentSpec.body.message).toContain('Invalid specialization or no doctors found');

    // D. GET /doctor?search=pramod (partial search, case-insensitive)
    const getSearchPramod = await request(app.getHttpServer()).get('/doctor?search=pramod');
    expect(getSearchPramod.status).toBe(200);
    expect(getSearchPramod.body.data.length).toBe(1);
    expect(getSearchPramod.body.data[0].id).toBe(doctor1Id);

    // E. GET /doctor?search=nonexistent
    const getSearchNone = await request(app.getHttpServer()).get('/doctor?search=nonexistent');
    expect(getSearchNone.status).toBe(200);
    expect(getSearchNone.body.data).toEqual([]);
    expect(getSearchNone.body.message).toContain('No doctors found matching the search term');

    // F. GET /doctor?page=1&limit=1 (pagination)
    const getPageLimit = await request(app.getHttpServer()).get('/doctor?page=1&limit=1');
    expect(getPageLimit.status).toBe(200);
    expect(getPageLimit.body.data.length).toBe(1);
    expect(getPageLimit.body.total).toBe(2);
    expect(getPageLimit.body.limit).toBe(1);

    // G. GET /doctor?page=-1 (negative pagination)
    const getNegativePage = await request(app.getHttpServer()).get('/doctor?page=-1');
    expect(getNegativePage.status).toBe(200);
    expect(getNegativePage.body.page).toBe(1);
    expect(getNegativePage.body.limit).toBe(10);
    expect(getNegativePage.body.data.length).toBe(2);

    // H. GET /doctor?availability=true (availability filter)
    const getAvailable = await request(app.getHttpServer()).get('/doctor?availability=true');
    expect(getAvailable.status).toBe(200);
    expect(getAvailable.body.data.length).toBe(1);
    expect(getAvailable.body.data[0].id).toBe(doctor1Id);

    // I. GET /doctor?availability=false
    const getUnavailable = await request(app.getHttpServer()).get('/doctor?availability=false');
    expect(getUnavailable.status).toBe(200);
    expect(getUnavailable.body.data.length).toBe(1);
    expect(getUnavailable.body.data[0].id).toBe(doctor2Id);
  });

  it('3. GET /doctor/:id - Valid and Invalid ID formats', async () => {
    // A. Valid ID
    const getValid = await request(app.getHttpServer()).get(`/doctor/${doctor1Id}`);
    expect(getValid.status).toBe(200);
    expect(getValid.body.id).toBe(doctor1Id);
    expect(getValid.body.fullName).toBe('Dr. Pramod Munnoli');

    // B. Invalid ID format
    const getInvalidFormat = await request(app.getHttpServer()).get('/doctor/abc');
    expect(getInvalidFormat.status).toBe(404);
    expect(getInvalidFormat.body.message).toContain('Doctor with ID abc not found');

    // C. Non-existent ID
    const getNonExistentId = await request(app.getHttpServer()).get('/doctor/99999');
    expect(getNonExistentId.status).toBe(404);
    expect(getNonExistentId.body.message).toContain('Doctor with ID 99999 not found');
  });
});
