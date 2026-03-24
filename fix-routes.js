const fs = require('fs');

const files = [
  'app/api/admin/roles/[id]/route.ts',
  'app/api/admin/certificate-types/[id]/route.ts',
  'app/api/admin/campuses/[id]/route.ts',
  'app/api/admin/academic-areas/[id]/route.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  content = content.split('export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {').join('export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {');

  content = content.split('export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {').join('export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {');

  content = content.split('export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {').join('export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {');

  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
});