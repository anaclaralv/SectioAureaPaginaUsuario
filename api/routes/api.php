<?php
function rotear($method, $endpoint, $db) {
    $parts = explode('/', trim($endpoint, '/'));
    $resource = $parts[0] ?? '';
    $id = $parts[1] ?? null;
    $subresource = $parts[2] ?? null;
    
    // ========== ROTAS PÚBLICAS ==========
    if ($resource == 'login' && $method == 'POST') {
        $auth = new AuthController($db);
        $auth->login();
        return;
    }
    
    if (($resource == 'register' || $resource == 'cadastro') && $method == 'POST') {
        $auth = new AuthController($db);
        $auth->register();
        return;
    }
    
    if ($resource == 'inteligencias' && $method == 'GET') {
        $inteligencias = new Inteligencias($db);
        $stmt = $inteligencias->read();
        $result = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['metodo'] = json_decode($row['metodo']);
            $result[] = $row;
        }
        echo json_encode($result);
        return;
    }
    
    // ========== ROTAS PROTEGIDAS ==========
    $id_usuario_logado = AuthMiddleware::validarToken($db);
    
    switch ($resource) {
        case 'perfil':
        case 'usuarios':
            $controller = new UsuarioController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->buscar($id_usuario_logado);
            } elseif ($method == 'PUT') $controller->atualizar();
            elseif ($method == 'DELETE') $controller->deletar();
            break;
            
        case 'materias':
            $controller = new MateriaController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'blocos':
            $controller = new BlocoAnotacoesController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'cronogramas':
            $controller = new CronogramaController($db, $id_usuario_logado);
            if ($method == 'GET') $controller->listar();
            elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'cronometros':
            $controller = new CronometroController($db, $id_usuario_logado);
            if ($method == 'GET') $controller->listar();
            elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'eventos':
            $controller = new EventosController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($subresource == 'data' && $id) $controller->listarPorData($id);
                elseif ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'flashcards':
            $controller = new FlashcardController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($subresource == 'materia' && $id) $controller->listarPorMateria($id);
                elseif ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'tarefas':
            $controller = new TarefasController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'mapasmentais':
            $controller = new MapaMentalController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'diagramasfluxo':
            $controller = new DiagramaFluxoController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'bibliotecavideos':
            $controller = new BibliotecaVideosController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'gravacoesestudo':
            $controller = new GravacaoEstudoController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'gruposestudo':
            $controller = new GrupoEstudoController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'historicoleituras':
            $controller = new HistoricoLeituraController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'historicosimulados':
            $controller = new HistoricoSimuladoController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        case 'cornell':
            $controller = new CornellController($db, $id_usuario_logado);
            if ($method == 'GET') {
                if ($id) $controller->buscar($id);
                else $controller->listar();
            } elseif ($method == 'POST') $controller->criar();
            elseif ($method == 'PUT' && $id) $controller->atualizar($id);
            elseif ($method == 'DELETE' && $id) $controller->deletar($id);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(["message" => "Rota não encontrada"]);
    }
}
?>