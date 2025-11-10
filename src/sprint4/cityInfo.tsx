import { Button, Checkbox, Group, TextInput, MultiSelect, Text, Textarea, Table, NumberInput, Radio, FileInput, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';

const cities = ['Boston', 'Medford', 'Somerville', 'Arlington', 'Cambridge', 'Quincy', 'Brookline', 'Newton', 'Watertown'];
const countries = ['United States', 'Canada'];

// Checks if input is a number (can be decimal)
const requiredNumber = (label: string) => (value: unknown) => {
	const v = (value === 0 ? '0' : (value ?? '')).toString().trim();
	if (v === '') return `${label} is required`;
	return /^-?\d+(\.\d+)?$/.test(v) ? null : `${label} must be a number`;
};
// Checks if input is an integer 
const requiredInteger = (label: string) => (value: unknown) => {
	const v = (value === 0 ? '0' : (value ?? '')).toString().trim();
	if (v === '') return `${label} is required`;
	return /^\d+$/.test(v) ? null : `${label} must be a number`;
};


export default function CityInfo() {
	const [selectedCities, setSelectedCities] = useState<string[]>([]);
	const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
	const [percentages, setPercentages] = useState<Record<string, number>>({});

	const form = useForm({
		mode: 'controlled',
		validateInputOnChange: true,
		validateInputOnBlur: true,
		initialValues: {
			organization: '',
			description: '',
			time: '',
			cities: [] as string[],
			status: '',
			latitude: '',
			longitude: '',
			addressLine: '',
			city: '',
			state: '',
			zipCode: '',
			country: '',
			logoFile: null as File | null,
			logoUrl: '',
		},
		validate: {
			organization: (value) => (typeof value === 'string' ? null : 'Organization name must be a string'),
			time: requiredInteger('Time'),
			cities: (value) => (value.length > 0 ? null : 'Pick at least one city'),
			latitude: requiredNumber('Latitude'),
			longitude: requiredNumber('Longitude'),
			state: (value) => (typeof value === 'string' ? null : 'State name must be a string'),
			zipCode: requiredInteger('Zip Code'),
			country: (value) => (value ? null : 'Select a country'),
			status: (value) => (value ? null : 'Select a status'),
			logoFile: (_value, values) => (!values.logoFile && !values.logoUrl.trim() ? 'Provide a file or a link' : null),
			logoUrl: (value, values) => {
				if (!value.trim() && !values.logoFile) return 'Provide a file or a link';
				return typeof value === 'string' ? null : 'Enter a valid URL';
			},
		},
	});
	return (
		<div>
			<div className='mb-5'>
				<h1 className='text-3xl font-semibold'>Add New Partner</h1>
				<h2 className='text-lg text-gray-500'>Upload your partner data</h2>
			</div>

			<div className='p-4 border border-gray-300 rounded-xl'>
				<form onSubmit={form.onSubmit((values) => console.log(values))} className='flex flex-col gap-5'>
					<Group justify='space-between' align='flex-start'>
						<Text fw={600}>Name of Organzation <span className='text-red-600'>*</span></Text>
						<TextInput
							placeholder='Name'
							key={form.key('organization')}
							{...form.getInputProps('organization')}
							size="md"
							className='min-w-170'
							radius="md"
							required
						/>
					</Group>
					<Group justify='space-between' align='flex-start'>
						<Text fw={600}>Description <span className='text-red-600'>*</span></Text>
						<Textarea
							key={form.key('description')}
							{...form.getInputProps('description')}
							size="md"
							className='min-w-170'
							radius="md"
							required
						/>
					</Group>

					<Group align='right' justify='space-between'>
						{/* Selected Cities MultiSelect */}
						<Text fw={600}>Cities Served <span className='text-red-600'>*</span></Text>
						<MultiSelect
							placeholder="Select cities"
							data={cities}
							searchable
							nothingFoundMessage="Nothing found..."
							key={form.key('cities')}
							value={selectedCities}
							onChange={(values) => {
								setSelectedCities(values);
								form.setFieldValue('cities', values);
							}}
							error={form.errors.cities}
							size="md"
							className='min-w-170'
							radius="md"
						/>
					</Group>

					<Group justify='space-between' align='flex-start'>
						{/* Selected Cities Table */}
						{selectedCities.length > 0 && (
							<>
								<div></div>
								<div className='min-w-170'>
									<Table striped highlightOnHover withTableBorder>
										<Table.Thead>
											<Table.Tr>
												<Table.Th>Cities</Table.Th>
												<Table.Th>Percentage</Table.Th>
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											{selectedCities.map((city) => (
												<Table.Tr key={city}>
													<Table.Td>{city}</Table.Td>
													<Table.Td>
														<NumberInput
															placeholder="Enter %"
															min={0}
															max={100}
															suffix="%"
															value={percentages[city] || ''}
															onChange={(value) => {
																setPercentages((prev) => ({
																	...prev,
																	[city]: typeof value === 'number' ? value : 0
																}));
															}}
														/>
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
									</Table>
								</div>
							</>
						)}
					</Group>

			<Group justify='space-between' align='flex-start'>
				<Text fw={600}>Time it started <span className='text-red-600'>*</span></Text>
				<NumberInput
					placeholder='Time'
					key={form.key('time')}
					value={form.values.time as any}
					onChange={(val) => {
						const valStr = val?.toString() || '';
						if (valStr.length <= 4) {
							form.setFieldValue('time', val as any);
						}
					}}
					error={form.errors.time}
					size="md"
					className='min-w-170'
					radius="md"
					min={0}
					max={9999}
					step={1}
					clampBehavior="strict"
				/>
			</Group>
			<Radio.Group key={form.key('status')} {...form.getInputProps('status')} error={form.errors.status} required>
				<Group>
					<Text fw={600}>Status <span className='text-red-600'>*</span></Text>
					<div className='flex gap-40 ml-72'>
						<Radio value="active" label="Active" />
						<Radio value="waitlisted" label="Waitlisted" />
					</div>

				</Group>
			</Radio.Group>



					<Group justify='space-between' align='flex-start'>
						<Text fw={600}>Coords <span className='text-red-600'>*</span></Text>
						<div className='gap-4 flex'>
							<NumberInput
								placeholder='Latitude'
								key={form.key('latitude')}
								value={form.values.latitude as any}
								onChange={(val) => form.setFieldValue('latitude', val as any)}
								error={form.errors.latitude}
								size="md"
								className='min-w-83'
								radius="md"
								step={0.0001}
							/>
							<NumberInput
								placeholder='Longitude'
								key={form.key('longitude')}
								value={form.values.longitude as any}
								onChange={(val) => form.setFieldValue('longitude', val as any)}
								error={form.errors.longitude}
								size="md"
								className='min-w-83'
								radius="md"
								step={0.0001}
							/>
						</div>
					</Group>

					<Group justify='space-between' align='flex-start'>
						<Text fw={600}>Address <span className='text-red-600'>*</span></Text>
						<TextInput
							placeholder='Address Line'
							key={form.key('addressLine')}
							{...form.getInputProps('addressLine')}
							size="md"
							className='min-w-170'
							radius="md"
							required
						/>
						<div className='gap-4 flex ml-90'>
							<TextInput
								placeholder='City'
								key={form.key('city')}
								{...form.getInputProps('city')}
								size="md"
								className='min-w-83'
								radius="md"
								required
							/>
							<TextInput
								placeholder='State'
								key={form.key('state')}
								{...form.getInputProps('state')}
								size="md"
								className='min-w-83'
								radius="md"
								required
							/>
						</div>
						<div className='gap-4 flex ml-90'>
							<NumberInput
								placeholder='Zip Code'
								key={form.key('zipCode')}
								value={form.values.zipCode as any}
								onChange={(val) => form.setFieldValue('zipCode', val as any)}
								error={form.errors.zipCode}
								size="md"
								className='min-w-83'
								radius="md"
								step={1}
								min={0}
							/>
						<Select
							placeholder="Country"
							data={countries}
							searchable
							nothingFoundMessage="Nothing found..."
							key={form.key('country')}
							value={form.values.country || null}
							onChange={(val) => {
								setSelectedCountry(val);
								form.setFieldValue('country', val || '');
							}}
							error={form.errors.country}
							size="md"
							className='min-w-83'
							radius="md"
						/>
						</div>
					</Group>
					<Group justify='space-between' align='flex-start'>
						<Text fw={600}>Logo file or link</Text>
						<div className='gap-4 flex'>
							<FileInput
								accept="image/png,image/jpeg"
								placeholder="Upload image file"
								radius="md"
								clearable
								value={form.values.logoFile}
								onChange={(file) => form.setFieldValue('logoFile', file)}
								error={form.errors.logoFile || form.errors.logoUrl}
								className='min-w-83'
							/>
							<TextInput
								placeholder='Logo URL'
								key={form.key('logoUrl')}
								{...form.getInputProps('logoUrl')}
								radius="md"
								className='min-w-83'
							/>
						</div>
					</Group>


					<Group justify="flex-end" mt="md">
						<Button
							variant="outline"
							color="#053766"
							radius="md"
							type="button"
							onClick={() => {
								form.reset();
								setSelectedCities([]);
								setPercentages({});
								setSelectedCountry(null);
							}}
						>
							Cancel
						</Button>
						<Button variant="filled" color="#053766" radius="md" type="submit">Submit</Button>
					</Group>
				</form>
			</div>


		</div>


	);

}