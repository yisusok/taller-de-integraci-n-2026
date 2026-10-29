import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  const mockSendMail = jest.fn();

  beforeEach(async () => {
    mockSendMail.mockReset();
    mockSendMail.mockResolvedValue({
      messageId: 'mock-message-id-1234',
    });

    (nodemailer.createTransport as jest.Mock) = jest.fn().mockReturnValue({
      sendMail: mockSendMail,
    });
    (nodemailer.getTestMessageUrl as jest.Mock) = jest
      .fn()
      .mockReturnValue('https://ethereal.email/message/test');

    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'password123';
    process.env.MAIL_FROM = '"E-Commerce" <no-reply@example.com>';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.MAIL_FROM;
    delete process.env.FRONTEND_URL;
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('sendPasswordResetEmail() envía un correo con el enlace de recuperación y token', async () => {
    const result = await service.sendPasswordResetEmail(
      'usuario@example.com',
      'token-abc-123',
    );

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
      }),
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'usuario@example.com',
        subject: 'Recuperación de contraseña — E-Commerce',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        html: expect.stringContaining('/reset-password?token=token-abc-123'),
      }),
    );

    expect(result.previewUrl).toBe('https://ethereal.email/message/test');
  });
});
