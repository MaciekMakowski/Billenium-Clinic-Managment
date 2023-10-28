import {
  AppointmentResponseType,
  UserProfileInfoType,
} from '../../../helpers/types';
import {
  Button,
  Center,
  Container,
  Flex,
  List,
  Loader,
  ScrollArea,
  Text,
} from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';

import { FlexibleAccordion } from '../../UI/FlexibleAccordion';
import axios from 'axios';
import { domainURL } from '../../../helpers/url';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const PATIENT_INFO_URL = `${domainURL}/api/patients`;
const infoBorder = { borderLeft: '2px solid #fd7e14' };

const PatientProfileInfo = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const patientId = pathname.split('/')[2];
  const [medicinesList, setMedicinesList] = useState<string[]>([]);
  const [allergiesList, setAllergiesList] = useState<string[]>([]);
  const fetchPatientInfo = async () => {
    const response = await axios.get(`${PATIENT_INFO_URL}/${patientId}`);
    return response.data as UserProfileInfoType;
  };
  const NEW_APPOINTMENT_URL = `${domainURL}/api/patients/${patientId}/appointments`;

  const fetchNewAppointments = async () => {
    const response = await axios.get(NEW_APPOINTMENT_URL);
    return response.data as AppointmentResponseType[];
  };

  const patientInfo = useQuery(
    [`patientInfoProfile`, patientId],
    fetchPatientInfo,
    {
      onSuccess(data) {
        setMedicinesList(data.medicines.split(','));
        setAllergiesList(data.allergies.split(','));
      },
    }
  );
  const patientAppointments = useQuery(
    [`appointments`, patientId],
    fetchNewAppointments
  );

  const filteredAppointments = patientAppointments.data ? patientAppointments.data?.filter(
    (appointment) =>
      appointment.appointmentStatus === 'DONE' ||
      appointment.appointmentStatus === 'CANCELED'
  ) : [];
  return (
    <Container miw="80%">
      <Flex direction="column" py="lg">
        <Flex
          direction="column"
          justify="center"
          align="center"
          w="100%"
          gap="md"
        >
          <Text fz="xl" fw="bold">
            Informacje o pacjencie
          </Text>
          <Flex gap="xl">
            {patientInfo.isLoading ? (
              <Loader my="lg" />
            ) : (
              <>
                <Flex gap="sm" direction="column">
                  <Text style={infoBorder} pl={3}>
                    Imię i nazwisko:{' '}
                    <Text span fw="bold">
                      {patientInfo.data?.patientUserInfo.firstName}{' '}
                      {patientInfo.data?.patientUserInfo.lastName}
                    </Text>
                  </Text>
                  <Text style={infoBorder} pl={3}>
                    Telefon:{' '}
                    <Text span fw="bold">
                      {patientInfo.data?.patientUserInfo.phoneNumber}
                    </Text>
                  </Text>
                  <Text style={infoBorder} pl={3}>
                    Data urodzenia:{' '}
                    <Text span fw="bold">
                      {patientInfo.data?.patientUserInfo.birthdate}
                    </Text>
                  </Text>
                </Flex>
                <Flex gap="sm" direction="column">
                  <Text style={infoBorder} pl={3}>
                    PESEL:{' '}
                    <Text span fw="bold">
                      {patientInfo.data?.patientUserInfo.pesel}
                    </Text>
                  </Text>
                  <Text style={infoBorder} pl={3}>
                    Email:{' '}
                    <Text span fw="bold">
                      {patientInfo.data?.patientUserInfo.email}
                    </Text>
                  </Text>
                  <Text style={infoBorder} pl={3}>
                    Adres:{' '}
                    <Text span fw="bold">
                      {patientInfo.data?.addressResponseDTO.street},{' '}
                      {patientInfo.data?.addressResponseDTO.city}{' '}
                      {patientInfo.data?.addressResponseDTO.zipCode}
                    </Text>
                  </Text>
                </Flex>
                <Flex direction="column">
                  {medicinesList[0] !== '' ? (
                    <>
                      <Text mt="md" style={infoBorder} pl={3}>
                        Stosowane leki:{' '}
                      </Text>
                      <ScrollArea h={80} offsetScrollbars type='always'>
                        <List>
                          {medicinesList.map((medicine, index) => {
                            return (
                              <List.Item pl={5} key={index}>{medicine}</List.Item>
                            );
                          })}
                        </List>
                      </ScrollArea>
                    </>
                  ) : (
                    <Text mt="md" style={infoBorder} pl={3}>
                      Brak stosowanych leków
                    </Text>
                  )}
                </Flex>
                <Flex direction="column">
                  {allergiesList[0] !== '' ? (
                    <>
                      <Text mt="md" style={infoBorder} pl={3}>
                        Alergie:{' '}
                      </Text>
                      <ScrollArea h={80} offsetScrollbars type='always'>
                        <List>
                          {allergiesList.map((allergy, index) => {
                            return <List.Item pl={5}  key={index}>{allergy}</List.Item>;
                          })}
                        </List>
                      </ScrollArea>
                    </>
                  ) : (
                    <Text mt="md" style={infoBorder} pl={3}>
                      Brak alergii
                    </Text>
                  )}
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
        <Flex direction="column" align="center">
          <Text fz="lg" fw="bold" my="md">
            Historia wizyt pacjenta
          </Text>
          {patientAppointments.isLoading ? (
            <Loader my="lg" />
          ) : (
            <ScrollArea h={590} offsetScrollbars w="50vw">
              <Center>
                {filteredAppointments && filteredAppointments.length > 0 ? (
                  <FlexibleAccordion
                    dataList={filteredAppointments || []}
                    firstTableTitle="Leki:"
                    secondTableTitle="Objawy:"
                    isWithStatus
                    fullWidth
                    isWithDiagnosis
                  />
                ) : (
                  <Text>Brak wizyt</Text>
                )}
              </Center>
            </ScrollArea>
          )}
        </Flex>
      </Flex>
      <Center>
        <Button onClick={() => navigate(-1)} my="md">
          Powrót
        </Button>
      </Center>
    </Container>
  );
};

export default PatientProfileInfo;
