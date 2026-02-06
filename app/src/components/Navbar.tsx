import {
  FiCreditCard,
  FiArrowDown,
  FiArrowUp,
  FiShield,
  FiActivity,
} from "react-icons/fi";
import {
  Box,
  Flex,
  Button,
  Text,
  Icon,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Flex justify="space-between" align="center" maxW="7xl" mx="auto">
        <HStack spacing={8}>
          <Link to="/">
            <HStack spacing={2}>
              <Icon as={FiShield} boxSize={6} color="ginva.500" />
              <Text fontSize="xl" fontWeight="bold" color="ginva.600">
                Ginva
              </Text>
            </HStack>
          </Link>

          <HStack spacing={6} display={{ base: "none", md: "flex" }}>
            <Link to="/">
              <HStack color="gray.600" _hover={{ color: "ginva.500" }}>
                <Icon as={FiActivity} />
                <Text>Dashboard</Text>
              </HStack>
            </Link>
            <Link to="/deposit">
              <HStack color="gray.600" _hover={{ color: "ginva.500" }}>
                <Icon as={FiArrowDown} />
                <Text>Deposit</Text>
              </HStack>
            </Link>
            <Link to="/borrow">
              <HStack color="gray.600" _hover={{ color: "ginva.500" }}>
                <Icon as={FiArrowUp} />
                <Text>Borrow</Text>
              </HStack>
            </Link>
            <Link to="/repay">
              <HStack color="gray.600" _hover={{ color: "ginva.500" }}>
                <Icon as={FiCreditCard} />
                <Text>Repay</Text>
              </HStack>
            </Link>
          </HStack>
        </HStack>

        <Button
          colorScheme="ginva"
          size="sm"
          leftIcon={<FiCreditCard />}
          variant="outline"
        >
          Connect Wallet
        </Button>
      </Flex>
    </Box>
  );
};

export default Navbar;
