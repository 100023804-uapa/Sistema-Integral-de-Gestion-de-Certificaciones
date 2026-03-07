import { importCertificatesFromExcel } from '@/app/actions/import-certificates';

async function testImport() {
    const mockData = [
        { Matricula: "TEST-001", Nombre: "Test Student", Folio: "F-TEST-1", Curso: "Course 1", Fecha: "2024-01-01" },
        { Matricula: "TEST-001", Nombre: "Test Student", Folio: "F-TEST-2", Curso: "Course 2", Fecha: "2024-02-01" },
    ];

    console.log("Starting import test...");
    const result = await importCertificatesFromExcel(mockData, "TEST-CAMPUS-ID");
    console.log("Import result:", JSON.stringify(result, null, 2));
}

export default testImport;
