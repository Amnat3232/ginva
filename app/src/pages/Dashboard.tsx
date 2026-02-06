import {
  Box,
  SimpleGrid,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  HStack,
  Icon,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { FiDollarSign, FiTrendingUp, FiUsers, FiPercent } from "react-icons/fi";

interface StatsCardProps {
  label: string;
  value: string;
  helpText: string;
  icon: any;
  color: string;
}

const StatsCard = ({ label, value, helpText, icon, color }: StatsCardProps) => {
  return (
    <Card>
      <CardBody>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <StatLabel color="gray.500">{label}</StatLabel>
            <StatNumber fontSize="2xl" color={color}>
              {value}
            </StatNumber>
            <StatHelpText mb={0}>{helpText}</StatHelpText>
          </VStack>
          <Box p={3} bg={`${color}.100`} borderRadius="lg">
            <Icon as={icon} boxSize={6} color={`${color}.500`} />
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );
};

const Dashboard = () => {
  return (
    <Box maxW="7xl" mx="auto" p={6}>
      <VStack align="start" spacing={6}>
        <Box>
          <Heading size="lg">Dashboard</Heading>
          <Text color="gray.500">Overview of Ginva Protocol</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
          <StatsCard
            label="Total Value Locked"
            value="$0"
            helpText="0 USDC"
            icon={FiDollarSign}
            color="ginva"
          />
          <StatsCard
            label="Total Borrowed"
            value="$0"
            helpText="0 Loans"
            icon={FiTrendingUp}
            color="blue"
          />
          <StatsCard
            label="Active Users"
            value="0"
            helpText="Connected Wallets"
            icon={FiUsers}
            color="purple"
          />
          <StatsCard
            label="Health Factor"
            value="-"
            helpText="No Active Loans"
            icon={FiPercent}
            color="orange"
          />
        </SimpleGrid>

        <Card w="full">
          <CardHeader>
            <Heading size="md">Your Loans</Heading>
          </CardHeader>
          <CardBody>
            <Box textAlign="center" py={10}>
              <Text color="gray.500">
                No active loans. Start by depositing collateral and borrowing
                USDC.
              </Text>
            </Box>
          </CardBody>
        </Card>

        <HStack spacing={4} w="full" pt={4}>
          <Badge colorScheme="green" px={3} py={1}>
            Devnet
          </Badge>
          <Text color="gray.500" fontSize="sm">
            Version 2.0.0
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
};

export default Dashboard;
