import { Box, Heading, Text, VStack } from "@chakra-ui/react";

const Deposit = () => {
  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack align="start" spacing={6}>
        <Box>
          <Heading size="lg">Deposit Collateral</Heading>
          <Text color="gray.500">Deposit SOL, BTC, or ETH as collateral</Text>
        </Box>

        <Box w="full" p={6} bg="white" borderRadius="lg" shadow="sm">
          <Text color="gray.500" textAlign="center" py={10}>
            Deposit interface coming soon...
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default Deposit;
