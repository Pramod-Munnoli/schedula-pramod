import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Onboarding (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Doctor Onboarding Flow', async () => {
    const email = `doctor-${Date.now()}@test.com`;
    const password = 'Password123!';

    // 1. Signup
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, role: 'DOCTOR' });
    console.log('Signup Response:', signupRes.status, signupRes.body);
    expect(signupRes.status).toBe(201);

    // 2. Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    console.log('Login Response:', loginRes.status, loginRes.body);
    expect(loginRes.status).toBe(201);
    const token = loginRes.body.access_token;

    // 3. Create Profile
    const createRes = await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Dr. John Doe',
        specialization: 'Cardiology',
        experience: 10,
        qualification: 'MD',
        consultationFee: 200,
        availabilityHours: '9am-5pm',
        profileDetails: 'Cardiologist with 10 years of experience',
      });
    console.log('Create Profile Response:', createRes.status, createRes.body);
    expect(createRes.status).toBe(201);

    // 4. Get Profile
    const getRes = await request(app.getHttpServer())
      .get('/doctor/profile')
      .set('Authorization', `Bearer ${token}`);
    console.log('Get Profile Response:', getRes.status, getRes.body);
    expect(getRes.status).toBe(200);

    // 5. Update Profile
    const updateRes = await request(app.getHttpServer())
      .patch('/doctor/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        consultationFee: 250,
      });
    console.log('Update Profile Response:', updateRes.status, updateRes.body);
    expect(updateRes.status).toBe(200);
  });
});
