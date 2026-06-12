import { MigrationInterface, QueryRunner } from "typeorm";

export class SlotGenerationAndAppointments1781259279478 implements MigrationInterface {
    name = 'SlotGenerationAndAppointments1781259279478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "appointment" ("id" SERIAL NOT NULL, "doctorId" integer NOT NULL, "patientId" integer, "date" date NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "status" character varying NOT NULL DEFAULT 'SCHEDULED', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "doctor" ADD "slotDuration" integer NOT NULL DEFAULT '15'`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_514bcc3fb1b8140f85bf1cde6e2" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_5ce4c3130796367c93cd817948e" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_5ce4c3130796367c93cd817948e"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_514bcc3fb1b8140f85bf1cde6e2"`);
        await queryRunner.query(`ALTER TABLE "doctor" DROP COLUMN "slotDuration"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
    }

}
