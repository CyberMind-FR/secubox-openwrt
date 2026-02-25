# SPDX-License-Identifier: GPL-2.0-or-later
# ZKP Hamiltonian - Zero-Knowledge Proof based on Hamiltonian Cycle
# CyberMind.FR / SecuBox

cmake_minimum_required(VERSION 3.16)
project(zkp_hamiltonian C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Compiler warnings
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Wextra -Werror")

# Build options
option(OPENWRT_BUILD "Build for OpenWrt (no debug output)" OFF)
option(BUILD_TESTS "Build test executables" ON)
option(BUILD_TOOLS "Build CLI tools" ON)
option(BUILD_SHARED_LIBS "Build shared library" OFF)
option(BUILD_DAEMON "Build secubox-zkpd daemon" OFF)
option(USE_LIBSODIUM "Use libsodium (currently only for compat)" ON)

# Configurable parameters
set(ZKP_MAX_N "128" CACHE STRING "Maximum number of graph nodes")

# OpenWrt-specific flags
if(OPENWRT_BUILD)
    add_compile_definitions(OPENWRT_BUILD)
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Os -ffunction-sections -fdata-sections")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,--gc-sections")
    set(BUILD_TESTS OFF)
endif()

# Find required packages
find_package(PkgConfig REQUIRED)

# OpenSSL is required for SHA3-256
find_package(OpenSSL REQUIRED)
if(NOT OpenSSL_FOUND)
    message(FATAL_ERROR "OpenSSL not found. Required for SHA3-256.")
endif()

# libsodium is optional (used if USE_LIBSODIUM is ON)
if(USE_LIBSODIUM)
    pkg_check_modules(SODIUM libsodium)
    if(SODIUM_FOUND)
        add_compile_definitions(HAVE_LIBSODIUM)
    endif()
endif()

# Set max nodes at compile time
add_compile_definitions(ZKP_MAX_N=${ZKP_MAX_N})

# ── Main Library ────────────────────────────────────────────────────────────

set(ZKP_SOURCES
    src/zkp_crypto.c
    src/zkp_graph.c
    src/zkp_prove.c
    src/zkp_verify.c
    src/zkp_serialize.c
)

if(BUILD_SHARED_LIBS)
    add_library(zkp_hamiltonian SHARED ${ZKP_SOURCES})
    set_target_properties(zkp_hamiltonian PROPERTIES
        VERSION 0.1.0
        SOVERSION 0
    )
else()
    add_library(zkp_hamiltonian STATIC ${ZKP_SOURCES})
endif()

target_include_directories(zkp_hamiltonian PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include/zkp-hamiltonian>
)

target_link_libraries(zkp_hamiltonian
    OpenSSL::Crypto
)

if(SODIUM_FOUND)
    target_link_libraries(zkp_hamiltonian ${SODIUM_LIBRARIES})
    target_include_directories(zkp_hamiltonian PRIVATE ${SODIUM_INCLUDE_DIRS})
endif()

# ── Tests ───────────────────────────────────────────────────────────────────

if(BUILD_TESTS)
    enable_testing()

    foreach(TEST graph crypto protocol nizk)
        add_executable(test_${TEST} tests/test_${TEST}.c)
        target_link_libraries(test_${TEST} zkp_hamiltonian)
        target_include_directories(test_${TEST} PRIVATE include)
        add_test(NAME ${TEST} COMMAND test_${TEST})
    endforeach()
endif()

# ── CLI Tools ───────────────────────────────────────────────────────────────

if(BUILD_TOOLS)
    foreach(TOOL keygen prover verifier)
        add_executable(zkp_${TOOL} tools/zkp_${TOOL}.c)
        target_link_libraries(zkp_${TOOL} zkp_hamiltonian)
        target_include_directories(zkp_${TOOL} PRIVATE include)
    endforeach()
endif()

# ── Installation ────────────────────────────────────────────────────────────

include(GNUInstallDirs)

install(TARGETS zkp_hamiltonian
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
)

install(DIRECTORY include/
    DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}/zkp-hamiltonian
    FILES_MATCHING PATTERN "*.h"
)

if(BUILD_TOOLS)
    install(TARGETS zkp_keygen zkp_prover zkp_verifier
        RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    )
endif()
