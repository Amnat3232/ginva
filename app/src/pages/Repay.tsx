import { Box, Heading, Text, VStack } from "@chakra-ui/react";

const Repay = () => {
  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack align="start" spacing={6}>
        <Box>
          <Heading size="lg">Repay Loan</Heading>
          <Text color="gray.500">Repay your loan and reclaim collateral</Text>
        </Box>

        <Box w="full" p={6} bg="white" borderRadius="lg" shadow="sm">
          <Text color="gray.500" textAlign="center" py={10}>
            Repay interface coming soon...
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default Repay;
